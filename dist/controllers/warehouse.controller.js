"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWarehouseDashboard = exports.createWarehouse = exports.getWarehouses = void 0;
const prisma_1 = require("../lib/prisma");
const zod_1 = require("zod");
const warehouseSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    location: zod_1.z.string().optional(),
    code: zod_1.z.string().min(2),
});
const getWarehouses = async (_req, res, next) => {
    try {
        const warehouses = await prisma_1.prisma.warehouse.findMany({
            include: {
                _count: {
                    select: { warehouseStocks: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: warehouses });
    }
    catch (error) {
        next(error);
    }
};
exports.getWarehouses = getWarehouses;
const createWarehouse = async (req, res, next) => {
    try {
        const data = warehouseSchema.parse(req.body);
        const warehouse = await prisma_1.prisma.warehouse.create({ data });
        res.status(201).json({ success: true, data: warehouse });
    }
    catch (error) {
        next(error);
    }
};
exports.createWarehouse = createWarehouse;
const getWarehouseDashboard = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Total SKUs and Pieces
        const stocks = await prisma_1.prisma.warehouseStock.findMany({
            where: { warehouseId: id },
            include: { product: true }
        });
        const totalSkus = stocks.length;
        const totalPieces = stocks.reduce((acc, stock) => acc + stock.quantity, 0);
        const estimatedCost = stocks.reduce((acc, stock) => {
            return acc + (stock.quantity * Number(stock.product.cost));
        }, 0);
        res.json({
            success: true,
            data: {
                totalSkus,
                totalPieces,
                estimatedCost: estimatedCost.toString() // String for money
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getWarehouseDashboard = getWarehouseDashboard;
//# sourceMappingURL=warehouse.controller.js.map