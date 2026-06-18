"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/inventario.controller.ts
// Traspasos entre almacenes y consulta de Kardex.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCamiones = getCamiones;
exports.getLiquidacion = getLiquidacion;
exports.getAlmacenes = getAlmacenes;
exports.registrarTraspaso = registrarTraspaso;
exports.getKardex = getKardex;
exports.getAllKardex = getAllKardex;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const inventory_validator_1 = require("../validators/inventory.validator");
const errors_1 = require("../lib/errors");
// =============================================================================
// GET /api/v1/inventario/camiones
// Lista las ubicaciones de tipo MOVIL con su stock
// =============================================================================
async function getCamiones(_req, res, next) {
    try {
        const camiones = await prisma_1.prisma.inventoryLocation.findMany({
            where: { tipo: 'MOVIL' },
            include: {
                inventoryStocks: {
                    include: {
                        item: {
                            select: { id: true, sku: true, name: true, price: true },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        res.json({ success: true, data: camiones });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/inventario/camiones/:id/liquidacion
// Datos de liquidación para un camión específico
// =============================================================================
async function getLiquidacion(req, res, next) {
    try {
        const camion = await prisma_1.prisma.inventoryLocation.findUnique({
            where: { id: req.params.id },
            include: {
                inventoryStocks: {
                    include: { item: true },
                },
            },
        });
        if (!camion)
            throw new errors_1.NotFoundError(`Camión '${req.params.id}' no encontrado`);
        const productos = camion.inventoryStocks.map((s) => {
            const precio = s.item.price.toNumber();
            return {
                item: {
                    id: s.item.id,
                    sku: s.item.sku,
                    name: s.item.name,
                    price: s.item.price.toString(),
                },
                cargado: s.quantity,
                devuelto: 0,
                vendido: 0,
                montoEsperado: s.quantity * precio,
            };
        });
        const efectivoEsperado = productos.reduce((sum, p) => sum + p.montoEsperado, 0);
        res.json({
            success: true,
            data: {
                camion: { id: camion.id, name: camion.name, tipo: camion.tipo },
                productos,
                efectivoEsperado,
                efectivoEntregado: 0,
                discrepancia: 0,
            },
        });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/inventario/almacenes
// Lista todos los almacenes con su stock
// =============================================================================
async function getAlmacenes(_req, res, next) {
    try {
        const almacenes = await prisma_1.prisma.location.findMany({
            include: {
                inventories: {
                    include: {
                        item: { select: { id: true, sku: true, name: true, globalStock: true } },
                    },
                    take: 10,
                },
            },
            orderBy: { name: 'asc' },
        });
        const data = almacenes.map((w) => ({
            id: w.id,
            name: w.name,
            tipo: 'CENTRAL',
            inventoryStocks: w.inventories,
        }));
        res.json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// POST /api/v1/inventario/traspaso
// Mueve inventario entre almacenes atomicamente y registra en Kardex.
// =============================================================================
async function registrarTraspaso(req, res, next) {
    try {
        const dto = inventory_validator_1.TraspasoSchema.parse(req.body);
        // Pre-validaciones fuera de TX para mensajes de error precisos
        const [item, origen, destino, usuario] = await Promise.all([
            prisma_1.prisma.item.findUnique({ where: { id: dto.itemId } }),
            prisma_1.prisma.inventoryLocation.findUnique({ where: { id: dto.locationOrigenId } }),
            prisma_1.prisma.inventoryLocation.findUnique({ where: { id: dto.locationDestinoId } }),
            prisma_1.prisma.user.findUnique({ where: { id: dto.userId } }),
        ]);
        if (!item)
            throw new errors_1.NotFoundError(`Producto '${dto.itemId}' no encontrado`);
        if (!origen)
            throw new errors_1.NotFoundError(`Almacén origen '${dto.locationOrigenId}' no encontrado`);
        if (!destino)
            throw new errors_1.NotFoundError(`Almacén destino '${dto.locationDestinoId}' no encontrado`);
        if (!usuario)
            throw new errors_1.NotFoundError(`Usuario '${dto.userId}' no encontrado`);
        // =========================================================================
        // TRANSACCIÓN ATÓMICA — SERIALIZABLE
        // 1. Descontar stock del almacén origen (con guard anti-negativo)
        // 2. Incrementar stock en almacén destino (upsert)
        // 3. Registrar movimiento en Kardex
        // =========================================================================
        const kardex = await prisma_1.prisma.$transaction(async (tx) => {
            // Paso 1: Descontar origen con guard anti-race
            const originUpdate = await tx.inventoryStock.updateMany({
                where: {
                    locationId: dto.locationOrigenId,
                    itemId: dto.itemId,
                    quantity: { gte: dto.cantidad },
                },
                data: { quantity: { decrement: dto.cantidad } },
            });
            if (originUpdate.count === 0) {
                const stockOrigen = await tx.inventoryStock.findFirst({
                    where: { locationId: dto.locationOrigenId, itemId: dto.itemId },
                    select: { quantity: true },
                });
                const disponible = stockOrigen?.quantity ?? 0;
                throw new errors_1.UnprocessableEntityError(`Stock insuficiente en almacén origen. Disponible: ${disponible}, Solicitado: ${dto.cantidad}`, 'STOCK_INSUFICIENTE');
            }
            // Paso 2: Incrementar destino (upsert — puede no existir el registro)
            await tx.inventoryStock.upsert({
                where: {
                    locationId_itemId: {
                        locationId: dto.locationDestinoId,
                        itemId: dto.itemId,
                    },
                },
                create: {
                    locationId: dto.locationDestinoId,
                    itemId: dto.itemId,
                    quantity: dto.cantidad,
                },
                update: { quantity: { increment: dto.cantidad } },
            });
            // Paso 3: Registrar en Kardex (inmutable)
            const movimiento = await tx.kardexMovement.create({
                data: {
                    tipo: 'TRASPASO',
                    cantidad: dto.cantidad,
                    locationOrigenId: dto.locationOrigenId,
                    locationDestinoId: dto.locationDestinoId,
                    itemId: dto.itemId,
                    userId: dto.userId,
                    notes: dto.notes,
                },
                include: {
                    item: { select: { id: true, sku: true, name: true } },
                    user: { select: { id: true, name: true } },
                },
            });
            return movimiento;
        }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable, timeout: 10_000 });
        res.status(201).json({ success: true, data: kardex });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// GET /api/v1/inventario/kardex/:itemId
// Historial inmutable de movimientos de un producto (paginado)
// =============================================================================
async function getKardex(req, res, next) {
    try {
        const { itemId } = req.params;
        const { page = '1', limit = '50' } = req.query;
        const take = Math.min(parseInt(limit, 10) || 50, 200);
        const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
        const item = await prisma_1.prisma.item.findUnique({ where: { id: itemId } });
        if (!item)
            throw new errors_1.NotFoundError(`Producto '${itemId}' no encontrado`);
        const [movements, total] = await Promise.all([
            prisma_1.prisma.kardexMovement.findMany({
                where: { itemId },
                orderBy: { timestamp: 'desc' },
                skip,
                take,
                include: {
                    item: { select: { id: true, sku: true, name: true } },
                    user: { select: { id: true, name: true } },
                },
            }),
            prisma_1.prisma.kardexMovement.count({ where: { itemId } }),
        ]);
        res.json({
            success: true,
            data: movements,
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
// GET /api/v1/inventario/kardex (todos los movimientos)
// =============================================================================
async function getAllKardex(req, res, next) {
    try {
        const { page = '1', limit = '50', tipo } = req.query;
        const take = Math.min(parseInt(limit, 10) || 50, 200);
        const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
        const where = tipo
            ? { tipo: tipo }
            : {};
        const [movements, total] = await Promise.all([
            prisma_1.prisma.kardexMovement.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                skip,
                take,
                include: {
                    item: { select: { id: true, sku: true, name: true } },
                    user: { select: { id: true, name: true } },
                },
            }),
            prisma_1.prisma.kardexMovement.count({ where }),
        ]);
        res.json({
            success: true,
            data: movements,
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
//# sourceMappingURL=inventario.controller.js.map