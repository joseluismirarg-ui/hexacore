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
        const productIds = dto.items.map((i) => i.productId);
        const products = await prisma_1.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
        });
        if (products.length !== productIds.length) {
            const foundIds = products.map((p) => p.id);
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
                        productId: item.productId,
                        cantidad: item.cantidad,
                        costUnit: new client_1.Prisma.Decimal(item.costUnit),
                    })),
                },
            },
            include: {
                supplier: { select: { id: true, name: true, rfc: true } },
                items: { include: { product: { select: { id: true, sku: true, name: true } } } },
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
                items: { include: { product: true } },
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
            include: { items: { include: { product: true } } },
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
                    items: { include: { product: { select: { id: true, sku: true, name: true } } } },
                },
            });
            // Pasos 2, 3, 4: Por cada ítem
            for (const item of order.items) {
                // Sumar stock en destino
                await tx.inventoryStock.upsert({
                    where: {
                        locationId_productId: {
                            locationId: dto.locationId,
                            productId: item.productId,
                        },
                    },
                    create: {
                        locationId: dto.locationId,
                        productId: item.productId,
                        quantity: item.cantidad,
                    },
                    update: { quantity: { increment: item.cantidad } },
                });
                // Actualizar globalStock desnormalizado
                await tx.product.update({
                    where: { id: item.productId },
                    data: { globalStock: { increment: item.cantidad } },
                });
                // Registrar en Kardex
                await tx.kardexMovement.create({
                    data: {
                        tipo: 'ENTRADA_COMPRA',
                        cantidad: item.cantidad,
                        locationDestinoId: dto.locationId,
                        locationOrigenId: null,
                        productId: item.productId,
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
async function listarProveedores(_req, res, next) {
    try {
        const suppliers = await prisma_1.prisma.supplier.findMany({
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
        const supplier = await prisma_1.prisma.supplier.create({ data });
        res.status(201).json({ success: true, data: supplier });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=purchase.controller.js.map