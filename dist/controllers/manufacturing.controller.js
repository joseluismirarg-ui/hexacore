"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManufacturingController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ManufacturingController {
    static async createBOM(req, res, next) {
        try {
            const { productId, components } = req.body;
            if (!productId?.trim() || !components || !Array.isArray(components)) {
                res.status(400).json({ error: 'Datos inválidos' });
                return;
            }
            const existingBOM = await prisma.billOfMaterials.findUnique({ where: { productId } });
            if (existingBOM) {
                res.status(409).json({ error: 'Receta ya existe' });
                return;
            }
            const bom = await prisma.$transaction(async (tx) => {
                return await tx.billOfMaterials.create({
                    data: {
                        productId,
                        components: { create: components.map((c) => ({ componentId: c.componentId, quantityRequired: parseInt(c.quantityRequired) || 1 })) }
                    }
                });
            });
            res.status(201).json(bom);
        }
        catch (error) {
            next(error);
        }
    }
    static async processProductionOrder(req, res, next) {
        try {
            const { productId, quantity, warehouseId } = req.body;
            const productionQty = parseInt(quantity);
            if (isNaN(productionQty) || productionQty <= 0) {
                res.status(400).json({ error: 'Cantidad inválida' });
                return;
            }
            const bom = await prisma.billOfMaterials.findUnique({ where: { productId }, include: { components: true } });
            if (!bom) {
                res.status(400).json({ error: 'No existe receta' });
                return;
            }
            const result = await prisma.$transaction(async (tx) => {
                for (const item of bom.components) {
                    await tx.warehouseStock.update({
                        where: { warehouseId_productId: { warehouseId, productId: item.componentId } },
                        data: { quantity: { decrement: item.quantityRequired * productionQty } }
                    });
                }
                await tx.warehouseStock.upsert({
                    where: { warehouseId_productId: { warehouseId, productId } },
                    update: { quantity: { increment: productionQty } },
                    create: { warehouseId, productId, quantity: productionQty }
                });
                return { status: 'COMPLETED' };
            });
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ManufacturingController = ManufacturingController;
//# sourceMappingURL=manufacturing.controller.js.map