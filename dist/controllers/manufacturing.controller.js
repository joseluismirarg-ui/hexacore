"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManufacturingController = void 0;
const prisma_1 = require("../lib/prisma");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
class ManufacturingController {
    static async getBOMs(req, res, next) {
        try {
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const boms = await prisma_1.prisma.billOfMaterials.findMany({
                where: { tenantId },
                include: {
                    item: true,
                    components: {
                        include: {
                            component: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ success: true, data: boms });
        }
        catch (error) {
            next(error);
        }
    }
    static async createBOM(req, res, next) {
        try {
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const { itemId, productionCost, components } = req.body;
            if (!itemId?.trim() || !components || !Array.isArray(components)) {
                res.status(400).json({ error: 'Datos inválidos' });
                return;
            }
            const existingBOM = await prisma_1.prisma.billOfMaterials.findUnique({
                where: { itemId }
            });
            if (existingBOM) {
                res.status(409).json({ error: 'Este producto ya tiene una receta asociada' });
                return;
            }
            const bom = await prisma_1.prisma.$transaction(async (tx) => {
                return await tx.billOfMaterials.create({
                    data: {
                        itemId,
                        productionCost: productionCost ? Number(productionCost) : 0,
                        tenantId,
                        components: {
                            create: components.map((c) => ({
                                componentId: c.componentId,
                                quantityRequired: parseInt(c.quantityRequired) || 1
                            }))
                        }
                    },
                    include: {
                        item: true,
                        components: { include: { component: true } }
                    }
                });
            });
            res.status(201).json({ success: true, data: bom });
        }
        catch (error) {
            next(error);
        }
    }
    static async getWorkOrders(req, res, next) {
        try {
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const workOrders = await prisma_1.prisma.workOrder.findMany({
                where: { tenantId },
                include: {
                    bom: {
                        include: { item: true }
                    }
                },
                orderBy: { id: 'desc' }
            });
            res.json({ success: true, data: workOrders });
        }
        catch (error) {
            next(error);
        }
    }
    static async createWorkOrder(req, res, next) {
        try {
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const { bomId, quantity, notes } = req.body;
            if (!bomId || !quantity || quantity <= 0) {
                res.status(400).json({ error: 'Datos inválidos' });
                return;
            }
            const order = await prisma_1.prisma.workOrder.create({
                data: {
                    bomId,
                    quantity: parseInt(quantity),
                    notes,
                    status: 'PENDING',
                    tenantId
                }
            });
            res.status(201).json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    }
    static async startWorkOrder(req, res, next) {
        try {
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const userId = req.user?.id || 'system';
            const { workOrderId, locationId } = req.body;
            const order = await prisma_1.prisma.workOrder.findUnique({
                where: { id: workOrderId, tenantId },
                include: { bom: { include: { components: true } } }
            });
            if (!order) {
                res.status(404).json({ error: 'WorkOrder no encontrada' });
                return;
            }
            if (order.status !== 'PENDING') {
                res.status(400).json({ error: 'La orden no está en estado PENDIENTE' });
                return;
            }
            await prisma_1.prisma.$transaction(async (tx) => {
                for (const item of order.bom.components) {
                    const requiredQty = item.quantityRequired * order.quantity;
                    if (locationId) {
                        const updateComp = await tx.inventoryStock.updateMany({
                            where: { locationId, itemId: item.componentId, quantity: { gte: requiredQty } },
                            data: { quantity: { decrement: requiredQty } }
                        });
                        if (updateComp.count === 0) {
                            throw new Error(`Stock insuficiente para componente ${item.componentId} en la ubicación seleccionada.`);
                        }
                    }
                    const itemUpdate = await tx.item.updateMany({
                        where: { id: item.componentId, globalStock: { gte: requiredQty } },
                        data: { globalStock: { decrement: requiredQty } }
                    });
                    if (itemUpdate.count === 0) {
                        throw new Error(`Stock global insuficiente para el componente: ${item.componentId}`);
                    }
                    await tx.kardexMovement.create({
                        data: {
                            tipo: 'PRODUCCION_MANUFACTURA',
                            cantidad: -requiredQty,
                            locationOrigenId: locationId || null,
                            itemId: item.componentId,
                            userId: userId,
                            tenantId: tenantId,
                            notes: `Consumo (Inicio) para WorkOrder ${order.id}`
                        }
                    });
                }
                await tx.workOrder.update({
                    where: { id: order.id },
                    data: { status: 'IN_PROGRESS', startedAt: new Date() }
                });
            });
            res.status(200).json({ success: true, message: 'Orden iniciada' });
        }
        catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
    static async completeWorkOrder(req, res, next) {
        try {
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const userId = req.user?.id || 'system';
            const { workOrderId, locationId } = req.body;
            const order = await prisma_1.prisma.workOrder.findUnique({
                where: { id: workOrderId, tenantId },
                include: { bom: { include: { components: true } } }
            });
            if (!order) {
                res.status(404).json({ error: 'WorkOrder no encontrada' });
                return;
            }
            if (order.status !== 'IN_PROGRESS') {
                res.status(400).json({ error: 'La orden debe estar IN_PROGRESS' });
                return;
            }
            const result = await prisma_1.prisma.$transaction(async (tx) => {
                let totalMaterialCost = 0;
                for (const item of order.bom.components) {
                    const requiredQty = item.quantityRequired * order.quantity;
                    const componentItem = await tx.item.findUnique({ where: { id: item.componentId } });
                    const cost = componentItem?.cost ? Number(componentItem.cost) : 0;
                    totalMaterialCost += cost * requiredQty;
                }
                const productionCost = order.bom.productionCost ? Number(order.bom.productionCost) : 0;
                const unitCost = (totalMaterialCost / order.quantity) + productionCost;
                if (locationId) {
                    await tx.inventoryStock.upsert({
                        where: { locationId_itemId: { locationId, itemId: order.bom.itemId } },
                        update: { quantity: { increment: order.quantity } },
                        create: { locationId, itemId: order.bom.itemId, quantity: order.quantity }
                    });
                }
                const finalItem = await tx.item.findUnique({ where: { id: order.bom.itemId } });
                const currentStock = finalItem?.globalStock || 0;
                const currentTotalCost = (finalItem?.cost ? Number(finalItem.cost) : 0) * currentStock;
                const newTotalCost = currentTotalCost + (unitCost * order.quantity);
                const newAverageCost = (currentStock + order.quantity) > 0 ? (newTotalCost / (currentStock + order.quantity)) : unitCost;
                await tx.item.update({
                    where: { id: order.bom.itemId },
                    data: {
                        globalStock: { increment: order.quantity },
                        cost: newAverageCost
                    }
                });
                await tx.kardexMovement.create({
                    data: {
                        tipo: 'PRODUCCION_MANUFACTURA',
                        cantidad: order.quantity,
                        locationDestinoId: locationId || null,
                        itemId: order.bom.itemId,
                        userId: userId,
                        tenantId: tenantId,
                        notes: `Entrada (Completada) para WorkOrder ${order.id}. Costo Unitario Promedio: $${newAverageCost.toFixed(2)}`
                    }
                });
                const updatedOrder = await tx.workOrder.update({
                    where: { id: order.id },
                    data: { status: 'COMPLETED', completedAt: new Date() }
                });
                return { status: 'COMPLETED', unitCost, newAverageCost, quantityProduced: order.quantity };
            }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
            res.status(200).json({ success: true, message: 'Orden completada y costos promediados', data: result });
        }
        catch (error) {
            res.status(400).json({ error: error.message || 'Error al completar orden' });
        }
    }
}
exports.ManufacturingController = ManufacturingController;
//# sourceMappingURL=manufacturing.controller.js.map