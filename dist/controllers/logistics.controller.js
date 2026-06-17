"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class LogisticsController {
    static async createTransfer(req, res, next) {
        try {
            const { code, originId, destinationId, items } = req.body;
            if (!originId?.trim() || !destinationId?.trim()) {
                res.status(400).json({ error: 'originId y destinationId requeridos' });
                return;
            }
            if (originId === destinationId) {
                res.status(400).json({ error: 'Origen y destino no pueden ser el mismo' });
                return;
            }
            if (!items || !Array.isArray(items) || items.length === 0) {
                res.status(400).json({ error: 'items debe ser un array con elementos' });
                return;
            }
            const stockIssues = [];
            for (const item of items) {
                const stock = await prisma.warehouseStock.findUnique({ where: { warehouseId_productId: { warehouseId: originId, productId: item.productId } } });
                if ((stock?.quantity || 0) < item.quantity)
                    stockIssues.push(`Producto ${item.productId}: stock insuficiente`);
            }
            if (stockIssues.length > 0) {
                res.status(400).json({ error: 'Stock insuficiente', details: stockIssues });
                return;
            }
            const transfer = await prisma.stockTransfer.create({
                data: {
                    code: code || `TRF-${Date.now().toString(36).toUpperCase()}`, originId, destinationId, status: 'EN_TRANSITO',
                    items: { create: items.map((i) => ({ productId: i.productId, quantity: parseInt(i.quantity) })) }
                }
            });
            for (const item of items) {
                await prisma.warehouseStock.update({
                    where: { warehouseId_productId: { warehouseId: originId, productId: item.productId } },
                    data: { quantity: { decrement: parseInt(item.quantity) } }
                });
            }
            res.status(201).json(transfer);
        }
        catch (error) {
            next(error);
        }
    }
    static async receiveTransfer(req, res, next) {
        try {
            const { id } = req.params;
            const transfer = await prisma.stockTransfer.findUnique({ where: { id }, include: { items: true } });
            if (!transfer || transfer.status !== 'EN_TRANSITO') {
                res.status(400).json({ error: 'Traspaso no válido' });
                return;
            }
            const result = await prisma.$transaction(async (tx) => {
                for (const item of transfer.items) {
                    await tx.warehouseStock.upsert({
                        where: { warehouseId_productId: { warehouseId: transfer.destinationId, productId: item.productId } },
                        update: { quantity: { increment: item.quantity } },
                        create: { warehouseId: transfer.destinationId, productId: item.productId, quantity: item.quantity }
                    });
                }
                return await tx.stockTransfer.update({ where: { id }, data: { status: 'RECIBIDO' } });
            });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.LogisticsController = LogisticsController;
//# sourceMappingURL=logistics.controller.js.map