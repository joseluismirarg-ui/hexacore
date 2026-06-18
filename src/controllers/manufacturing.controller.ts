import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { tenantContext } from '../middleware/tenant.middleware';

export class ManufacturingController {
  
  static async getBOMs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const boms = await prisma.billOfMaterials.findMany({
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
    } catch (error) {
      next(error);
    }
  }

  static async createBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const { itemId, productionCost, components } = req.body;

      if (!itemId?.trim() || !components || !Array.isArray(components)) { 
        res.status(400).json({ error: 'Datos inválidos' }); 
        return; 
      }

      const existingBOM = await prisma.billOfMaterials.findUnique({ 
        where: { itemId } 
      });
      
      if (existingBOM) { 
        res.status(409).json({ error: 'Este producto ya tiene una receta asociada' }); 
        return; 
      }

      const bom = await prisma.$transaction(async (tx) => {
        return await tx.billOfMaterials.create({
          data: {
            itemId,
            productionCost: productionCost ? Number(productionCost) : 0,
            tenantId,
            components: { 
              create: components.map((c: any) => ({ 
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
    } catch (error) { next(error); }
  }

  static async processProductionOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
      const userId = (req as any).user?.id || 'system';
      const { itemId, quantity, locationId } = req.body; // itemId represents the final product to build
      
      const productionQty = parseInt(quantity);
      if (isNaN(productionQty) || productionQty <= 0) { 
        res.status(400).json({ error: 'Cantidad inválida' }); 
        return; 
      }

      const bom = await prisma.billOfMaterials.findUnique({ 
        where: { itemId }, 
        include: { components: true } 
      });

      if (!bom || bom.tenantId !== tenantId) { 
        res.status(400).json({ error: 'No existe receta para este producto' }); 
        return; 
      }

      const result = await prisma.$transaction(async (tx) => {
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
    } catch (error: any) { 
      res.status(400).json({ error: error.message || 'Error en la orden de producción' }); 
    }
  }
}
