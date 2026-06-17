import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class ManufacturingController {
  static async createBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { itemId, components } = req.body;
      if (!itemId?.trim() || !components || !Array.isArray(components)) { res.status(400).json({ error: 'Datos inválidos' }); return; }

      const existingBOM = await prisma.billOfMaterials.findUnique({ where: { itemId } });
      if (existingBOM) { res.status(409).json({ error: 'Receta ya existe' }); return; }

      const bom = await prisma.$transaction(async (tx) => {
        return await tx.billOfMaterials.create({
          data: {
            itemId,
            components: { create: components.map((c: any) => ({ componentId: c.componentId, quantityRequired: parseInt(c.quantityRequired) || 1 })) }
          }
        });
      });
      res.status(201).json(bom);
    } catch (error) { next(error); }
  }

  static async processProductionOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { itemId, quantity, locationId } = req.body;
      const productionQty = parseInt(quantity);
      if (isNaN(productionQty) || productionQty <= 0) { res.status(400).json({ error: 'Cantidad inválida' }); return; }

      const bom = await prisma.billOfMaterials.findUnique({ where: { itemId }, include: { components: true } });
      if (!bom) { res.status(400).json({ error: 'No existe receta' }); return; }

      const result = await prisma.$transaction(async (tx) => {
        for (const item of bom.components) {
          // Decrement component in location
          const updateComp = await tx.inventory.update({
            where: { locationId_itemId: { locationId, itemId: item.componentId } },
            data: { quantity: { decrement: item.quantityRequired * productionQty } }
          });

          if (updateComp.quantity < 0) {
              throw new Error(`Stock insuficiente para componente ${item.componentId}`);
          }

          // Decrement globalStock
          await tx.item.update({
            where: { id: item.componentId },
            data: { globalStock: { decrement: item.quantityRequired * productionQty } }
          });

          // Kardex for component
          await tx.kardexMovement.create({
            data: {
              tipo: 'SALIDA_VENTA', // Usamos un equivalente si no hay SALIDA_MANUFACTURA
              cantidad: item.quantityRequired * productionQty,
              locationOrigenId: locationId,
              itemId: item.componentId,
              userId: req.body.userId || 'system',
              notes: `Consumo para manufactura de ${itemId}`
            }
          });
        }
        
        // Increment final item in location
        await tx.inventory.upsert({
          where: { locationId_itemId: { locationId, itemId } },
          update: { quantity: { increment: productionQty } },
          create: { locationId, itemId, quantity: productionQty }
        });

        // Increment globalStock for final item
        await tx.item.update({
            where: { id: itemId },
            data: { globalStock: { increment: productionQty } }
        });

        // Kardex for final item
        await tx.kardexMovement.create({
            data: {
              tipo: 'AJUSTE_INVENTARIO', // Equivalente a ENTRADA_MANUFACTURA
              cantidad: productionQty,
              locationDestinoId: locationId,
              itemId: itemId,
              userId: req.body.userId || 'system',
              notes: `Entrada por manufactura (BOM)`
            }
        });

        return { status: 'COMPLETED' };
      });
      res.status(200).json(result);
    } catch (error) { next(error); }
  }
}
