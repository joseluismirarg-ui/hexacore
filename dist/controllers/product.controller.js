"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/controllers/product.controller.ts
// CRUD completo del catálogo de productos.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarProductos = listarProductos;
exports.getProducto = getProducto;
exports.crearProducto = crearProducto;
exports.actualizarProducto = actualizarProducto;
exports.eliminarProducto = eliminarProducto;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const product_validator_1 = require("../validators/product.validator");
const errors_1 = require("../lib/errors");
// =============================================================================
// GET /api/v1/productos
// Listado paginado con búsqueda opcional por nombre/SKU
// =============================================================================
async function listarProductos(req, res, next) {
    try {
        const { q, page = '1', limit = '50' } = req.query;
        const take = Math.min(parseInt(limit, 10) || 50, 200);
        const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;
        const where = q
            ? {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { sku: { contains: q, mode: 'insensitive' } },
                ],
            }
            : {};
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
            prisma_1.prisma.product.count({ where }),
        ]);
        res.json({
            success: true,
            data: products,
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
// GET /api/v1/productos/:id
// =============================================================================
async function getProducto(req, res, next) {
    try {
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                inventoryStocks: { include: { location: true } },
            },
        });
        if (!product)
            throw new errors_1.NotFoundError(`Producto '${req.params.id}' no encontrado`);
        res.json({ success: true, data: product });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// POST /api/v1/productos
// =============================================================================
async function crearProducto(req, res, next) {
    try {
        const dto = product_validator_1.CrearProductoSchema.parse(req.body);
        const exists = await prisma_1.prisma.product.findUnique({ where: { sku: dto.sku } });
        if (exists)
            throw new errors_1.ConflictError(`El SKU '${dto.sku}' ya existe en el catálogo`);
        const product = await prisma_1.prisma.product.create({
            data: {
                sku: dto.sku,
                name: dto.name,
                description: dto.description,
                cost: new client_1.Prisma.Decimal(dto.cost),
                price: new client_1.Prisma.Decimal(dto.price),
                globalStock: 0,
            },
        });
        res.status(201).json({ success: true, data: product });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// PATCH /api/v1/productos/:id
// =============================================================================
async function actualizarProducto(req, res, next) {
    try {
        const dto = product_validator_1.ActualizarProductoSchema.parse(req.body);
        const product = await prisma_1.prisma.product.findUnique({ where: { id: req.params.id } });
        if (!product)
            throw new errors_1.NotFoundError(`Producto '${req.params.id}' no encontrado`);
        if (dto.sku && dto.sku !== product.sku) {
            const skuExists = await prisma_1.prisma.product.findUnique({ where: { sku: dto.sku } });
            if (skuExists)
                throw new errors_1.ConflictError(`El SKU '${dto.sku}' ya está en uso`);
        }
        const updated = await prisma_1.prisma.product.update({
            where: { id: req.params.id },
            data: {
                ...(dto.sku !== undefined && { sku: dto.sku }),
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.cost !== undefined && { cost: new client_1.Prisma.Decimal(dto.cost) }),
                ...(dto.price !== undefined && { price: new client_1.Prisma.Decimal(dto.price) }),
            },
        });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
}
// =============================================================================
// DELETE /api/v1/productos/:id
// =============================================================================
async function eliminarProducto(req, res, next) {
    try {
        const product = await prisma_1.prisma.product.findUnique({ where: { id: req.params.id } });
        if (!product)
            throw new errors_1.NotFoundError(`Producto '${req.params.id}' no encontrado`);
        await prisma_1.prisma.product.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Producto eliminado correctamente' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=product.controller.js.map