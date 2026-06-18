"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/purchase.controller.ts
// Órdenes de compra y recepción de mercancía con actualización atómica de stock.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearOrdenCompra = crearOrdenCompra;
exports.listarOrdenesCompra = listarOrdenesCompra;
exports.getOrdenCompra = getOrdenCompra;
exports.recibirMercancia = recibirMercancia;
exports.listarProveedores = listarProveedores;
exports.crearProveedor = crearProveedor;
exports.generateMRPRecommendations = generateMRPRecommendations;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const purchase_validator_1 = require("../validators/purchase.validator");
const errors_1 = require("../lib/errors");
// =============================================================================
// POST /api/v1/compras
// Crea una orden de compra en estado PENDIENTE
// =============================================================================
async function crearOrdenCompra(req, res, next) {
    try {
        const dto = purchase_validator_1.CrearPurchaseOrderSchema.parse(req.body);
        const supplier = await prisma_1.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
        if (!supplier)
            throw new errors_1.NotFoundError(`Proveedor '${dto.supplierId}' no encontrado`);
        // Validar que todos los productos existan
        const productIds = dto.items.map((i) => i.itemId);
        const items = await prisma_1.prisma.item.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });
        if (items.length !== productIds.length) {
            const foundIds = items.map((p) => p.id);
            const missing = productIds.filter((id) => !foundIds.includes(id));
            throw new errors_1.NotFoundError(`Productos no encontrados: ${missing.join(', ')}`);
        }
        // Calcular total de la orden
        const totalAmount = dto.items.reduce((sum, item) => {
            return sum.add(new client_1.Prisma.Decimal(item.costUnit).mul(item.cantidad));
        }, new client_1.Prisma.Decimal(0));
        const order = await prisma_1.prisma.purchaseOrder.create({
            data: {
                supplierId: dto.supplierId,
                totalAmount,
                notes: dto.notes ?? null,
                status: 'PENDIENTE',
                items: {
                    create: dto.items.map((item) => ({
                        itemId: item.itemId,
                        cantidad: item.cantidad,
                        costUnit: new client_1.Prisma.Decimal(item.costUnit),
                    })),
                },
            },
            include: {
                supplier: { select: { id: true, name: true, rfc: true } },
                items: { include: { item: { select: { id: true, sku: true, name: true } } } },
            },
        });
        res.status(201).json({ success: true, data: order });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/compras
// Listado de órdenes de compra
// =============================================================================
async function listarOrdenesCompra(req, res, next) {
    try {
        const { status, page = '1', limit = '20' } = req.query;
        const take = Math.min(parseInt(limit, 10) || 20, 100);
        const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
        const where = status
            ? { status: status }
            : {};
        const [orders, total] = await Promise.all([
            prisma_1.prisma.purchaseOrder.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    supplier: { select: { id: true, name: true } },
                    _count: { select: { items: true } },
                },
            }),
            prisma_1.prisma.purchaseOrder.count({ where }),
        ]);
        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: Math.max(parseInt(page, 10) || 1, 1),
                limit: take,
                totalPages: Math.ceil(total / take),
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/compras/:id
// =============================================================================
async function getOrdenCompra(req, res, next) {
    try {
        const order = await prisma_1.prisma.purchaseOrder.findUnique({
            where: { id: req.params.id },
            include: {
                supplier: true,
                items: { include: { item: true } },
            },
        });
        if (!order)
            throw new errors_1.NotFoundError(`Orden de compra '${req.params.id}' no encontrada`);
        res.json({ success: true, data: order });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// POST /api/v1/compras/:id/recibir
// Marca la orden como RECIBIDA, suma stock y registra movimientos en Kardex.
// TODA la operación es SERIALIZABLE y atómica.
// =============================================================================
async function recibirMercancia(req, res, next) {
    try {
        const { id } = req.params;
        const dto = purchase_validator_1.RecibirMercanciaSchema.parse(req.body);
        // Pre-validaciones
        const order = await prisma_1.prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: { include: { item: true } } },
        });
        if (!order)
            throw new errors_1.NotFoundError(`Orden de compra '${id}' no encontrada`);
        if (order.status === 'RECIBIDA') {
            throw new errors_1.UnprocessableEntityError('Esta orden ya fue recibida anteriormente.', 'ORDEN_YA_RECIBIDA');
        }
        if (order.status === 'CANCELADA') {
            throw new errors_1.UnprocessableEntityError('No se puede recibir una orden cancelada.', 'ORDEN_CANCELADA');
        }
        const [usuario, location] = await Promise.all([
            prisma_1.prisma.user.findUnique({ where: { id: dto.userId } }),
            prisma_1.prisma.inventoryLocation.findUnique({ where: { id: dto.locationId } }),
        ]);
        if (!usuario)
            throw new errors_1.NotFoundError(`Usuario '${dto.userId}' no encontrado`);
        if (!location)
            throw new errors_1.NotFoundError(`Almacén '${dto.locationId}' no encontrado`);
        // =========================================================================
        // TRANSACCIÓN ATÓMICA — SERIALIZABLE
        // 1. Actualizar la orden a RECIBIDA
        // 2. Sumar stock en el almacén destino (upsert)
        // 3. Actualizar globalStock desnormalizado
        // 4. Registrar movimiento de Kardex por cada ítem
        // =========================================================================
        const updatedOrder = await prisma_1.prisma.$transaction(async (tx) => {
            // Paso 1: Marcar como RECIBIDA
            const updated = await tx.purchaseOrder.update({
                where: { id },
                data: { status: 'RECIBIDA', receivedAt: new Date() },
                include: {
                    supplier: { select: { id: true, name: true } },
                    items: { include: { item: { select: { id: true, sku: true, name: true } } } },
                },
            });
            // Pasos 2, 3, 4: Por cada ítem
            for (const orderItem of order.items) {
                const reqItems = req.body.items || [];
                const dtoItem = reqItems.find((i) => i.itemId === orderItem.itemId);
                if (!dtoItem)
                    continue;
                // Sumar stock en destino
                await tx.inventoryStock.upsert({
                    where: {
                        locationId_itemId: {
                            locationId: dto.locationId,
                            itemId: orderItem.itemId,
                        },
                    },
                    create: {
                        locationId: dto.locationId,
                        itemId: orderItem.itemId,
                        quantity: dtoItem.cantidad,
                        lotNumber: dtoItem.lotNumber || null,
                        expirationDate: dtoItem.expirationDate ? new Date(dtoItem.expirationDate) : null
                    },
                    update: { quantity: { increment: dtoItem.cantidad } },
                });
                // Actualizar globalStock desnormalizado
                await tx.item.update({
                    where: { id: orderItem.itemId },
                    data: { globalStock: { increment: dtoItem.cantidad } },
                });
                // Registrar en Kardex
                await tx.kardexMovement.create({
                    data: {
                        tipo: 'ENTRADA_COMPRA',
                        cantidad: dtoItem.cantidad,
                        locationDestinoId: dto.locationId,
                        locationOrigenId: null,
                        itemId: orderItem.itemId,
                        userId: dto.userId,
                        referenceId: id,
                        notes: dto.notes ?? `Recepción de OC ${id}`,
                    },
                });
            }
            return updated;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 });
        res.json({ success: true, data: updatedOrder });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/compras/proveedores
// Listado de proveedores
// =============================================================================
async function listarProveedores(req, res, next) {
    try {
        const tenantId = req.tenant?.id;
        const suppliers = await prisma_1.prisma.supplier.findMany({
            where: tenantId ? { tenantId } : undefined,
            orderBy: { name: 'asc' },
            include: { _count: { select: { purchaseOrders: true } } },
        });
        res.json({ success: true, data: suppliers });
    }
    catch (err) {
        next(err);
    }
}
const zod_1 = require("zod");
const supplierSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    rfc: zod_1.z.string().min(12).max(13),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
});
async function crearProveedor(req, res, next) {
    try {
        const data = supplierSchema.parse(req.body);
        const tenantId = req.tenant?.id;
        const supplier = await prisma_1.prisma.supplier.create({
            data: {
                ...data,
                tenantId
            }
        });
        res.status(201).json({ success: true, data: supplier });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/compras/mrp/recommendations
// Sugerencias de Reabastecimiento Automático (MRP)
// =============================================================================
async function generateMRPRecommendations(_req, res, next) {
    try {
        // Buscar todos los productos
        const allProducts = await prisma_1.prisma.item.findMany({
            select: { id: true, sku: true, name: true, globalStock: true, reorderPoint: true, cost: true }
        });
        const recommendations = allProducts
            .filter(p => p.globalStock <= p.reorderPoint)
            .map(p => ({
            ...p,
            suggestedOrderQty: Math.max(p.reorderPoint * 2 - p.globalStock, 10), // Sugerencia de traer suficiente para doblar el punto de reorden
            estimatedCost: new client_1.Prisma.Decimal(Math.max(p.reorderPoint * 2 - p.globalStock, 10)).mul(p.cost)
        }));
        res.status(200).json({ success: true, data: recommendations });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=purchase.controller.js.map