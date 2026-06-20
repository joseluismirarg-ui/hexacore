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
    static async processProductionOrder(req, res) {
        try {
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const userId = req.user?.id || 'system';
            const { itemId, quantity, locationId } = req.body; // itemId represents the final product to build
            const productionQty = parseInt(quantity);
            if (isNaN(productionQty) || productionQty <= 0) {
                res.status(400).json({ error: 'Cantidad inválida' });
                return;
            }
            const bom = await prisma_1.prisma.billOfMaterials.findUnique({
                where: { itemId },
                include: { components: true }
            });
            if (!bom || bom.tenantId !== tenantId) {
                res.status(400).json({ error: 'No existe receta para este producto' });
                return;
            }
            const result = await prisma_1.prisma.$transaction(async (tx) => {
                let totalMaterialCost = 0;
                for (const item of bom.components) {
                    const requiredQty = item.quantityRequired * productionQty;
                    // Encontrar costo del componente (simplificado, usaríamos cost de Item)
                    const componentItem = await tx.item.findUnique({ where: { id: item.componentId } });
                    const cost = componentItem?.cost ? Number(componentItem.cost) : 0;
                    totalMaterialCost += cost * requiredQty;
                    // Si pasaron una locationId, descontar de Inventories (locationId, itemId)
                    if (locationId) {
                        const updateComp = await tx.inventory.update({
                            where: { locationId_itemId: { locationId, itemId: item.componentId } },
                            data: { quantity: { decrement: requiredQty } }
                        });
                        if (updateComp.quantity < 0) {
                            throw new Error(`Stock insuficiente para componente en la ubicación seleccionada.`);
                        }
                    }
                    // Decrement globalStock always
                    const itemUpdate = await tx.item.update({
                        where: { id: item.componentId },
                        data: { globalStock: { decrement: requiredQty } }
                    });
                    if (itemUpdate.globalStock < 0) {
                        throw new Error(`Stock global insuficiente para el componente: ${itemUpdate.name}`);
                    }
                    // Kardex for component (Salida por manufactura)
                    await tx.kardexMovement.create({
                        data: {
                            tipo: 'PRODUCCION_MANUFACTURA',
                            cantidad: -requiredQty,
                            locationOrigenId: locationId || null,
                            itemId: item.componentId,
                            userId: userId,
                            tenantId: tenantId,
                            notes: `Consumo materia prima para manufactura de ${productionQty} unid. de ${itemId}`
                        }
                    });
                }
                // Alta del producto final
                const productionCost = bom.productionCost ? Number(bom.productionCost) : 0;
                const unitCost = (totalMaterialCost / productionQty) + productionCost;
                if (locationId) {
                    await tx.inventory.upsert({
                        where: { locationId_itemId: { locationId, itemId } },
                        update: { quantity: { increment: productionQty } },
                        create: { locationId, itemId, quantity: productionQty }
                    });
                }
                // Increment globalStock for final item and update cost
                await tx.item.update({
                    where: { id: itemId },
                    data: {
                        globalStock: { increment: productionQty },
                        cost: unitCost // actualizar el costo con el ultimo lote producido
                    }
                });
                // Kardex for final item
                await tx.kardexMovement.create({
                    data: {
                        tipo: 'PRODUCCION_MANUFACTURA',
                        cantidad: productionQty,
                        locationDestinoId: locationId || null,
                        itemId: itemId,
                        userId: userId,
                        tenantId: tenantId,
                        notes: `Entrada por manufactura. Costo Unitario estimado: $${unitCost.toFixed(2)}`
                    }
                });
                return { status: 'COMPLETED', unitCost, quantityProduced: productionQty };
            });
            res.status(200).json({ success: true, message: 'Producción ejecutada correctamente', data: result });
        }
        catch (error) {
            res.status(400).json({ error: error.message || 'Error en la orden de producción' });
        }
    }
    static async getWorkOrders(req, res, next) {
        try {
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const orders = await prisma_1.prisma.workOrder.findMany({
                where: { tenantId },
                include: { bom: { include: { item: true } } }
            });
            res.json({ success: true, data: orders });
        }
        catch (err) {
            next(err);
        }
    }
    static async createWorkOrder(req, res, next) {
        try {
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const { quantity, bomId } = req.body;
            const order = await prisma_1.prisma.workOrder.create({
                data: {
                    quantity: Number(quantity),
                    bomId,
                    tenantId,
                    status: 'PENDING'
                }
            });
            res.status(201).json({ success: true, data: order });
        }
        catch (err) {
            next(err);
        }
    }
    static async startWorkOrder(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const order = await prisma_1.prisma.workOrder.updateMany({
                where: { id, tenantId, status: 'PENDING' },
                data: { status: 'IN_PROGRESS', startedAt: new Date() }
            });
            if (order.count === 0) {
                res.status(400).json({ error: 'No se pudo iniciar la orden.' });
                return;
            }
            res.json({ success: true });
        }
        catch (err) {
            next(err);
        }
    }
    static async completeWorkOrder(req, res, next) {
        try {
            const { id } = req.params;
            const tenantId = tenant_middleware_1.tenantContext.getStore() || req.user?.tenantId;
            const order = await prisma_1.prisma.workOrder.updateMany({
                where: { id, tenantId, status: 'IN_PROGRESS' },
                data: { status: 'COMPLETED', completedAt: new Date() }
            });
            if (order.count === 0) {
                res.status(400).json({ error: 'No se pudo completar la orden.' });
                return;
            }
            res.json({ success: true });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ManufacturingController = ManufacturingController;
//# sourceMappingURL=manufacturing.controller.js.map