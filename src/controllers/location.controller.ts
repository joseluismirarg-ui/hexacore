import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const warehouseSchema = z.object({
  name: z.string().min(2),
  location: z.string().optional(),
  code: z.string().min(2),
});

export const getWarehouses = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const locations = await prisma.location.findMany({
      include: {
        _count: {
          select: { inventories: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
};

import { checkTenantLimits } from '../utils/limits';
import { tenantContext } from '../middleware/tenant.middleware';

export const createWarehouse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = warehouseSchema.parse(req.body);
    const tenantId = tenantContext.getStore() as string;
    
    await checkTenantLimits(tenantId, 'LOCATIONS');
    
    const location = await prisma.location.create({ data });
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Total SKUs and Pieces
    const stocks = await prisma.inventory.findMany({
      where: { locationId: id },
      include: { item: true }
    });

    const totalSkus = stocks.length;
    const totalPieces = stocks.reduce((acc, stock) => acc + stock.quantity, 0);
    const estimatedCost = stocks.reduce((acc, stock) => {
      return acc + (stock.quantity * Number(stock.item.cost));
    }, 0);

    res.json({
      success: true,
      data: {
        totalSkus,
        totalPieces,
        estimatedCost: estimatedCost.toString() // String for money
      }
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// CONTEOS CÍCLICOS (Inventario Físico)
// =============================================================================
export const startAudit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { locationId, productIds } = req.body;
    
    // Create Audit
    const audit = await prisma.inventoryAudit.create({
      data: {
        locationId,
        status: 'EN_PROGRESO',
        items: {
          create: productIds.map((id: string) => ({
            itemId: id,
            expectedQty: 0, // Will be updated
            countedQty: 0
          }))
        }
      },
      include: { items: true }
    });

    // Populate expectedQty from current stock
    for (const item of audit.items) {
      const stock = await prisma.inventory.findFirst({
        where: { locationId, itemId: item.itemId }
      });
      if (stock) {
        await prisma.inventoryAuditItem.update({
          where: { id: item.id },
          data: { expectedQty: stock.quantity }
        });
      }
    }

    res.status(201).json({ success: true, data: audit });
  } catch (error) {
    next(error);
  }
};

export const completeAudit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auditId, results } = req.body; // results: { itemId: string, countedQty: number }[]

    const result = await prisma.$transaction(async (tx) => {
      const audit = await tx.inventoryAudit.findUnique({ 
        where: { id: auditId },
        include: { items: true }
      });
      if (!audit || audit.status === 'COMPLETADO') throw new Error('Auditoría inválida o ya completada');

      for (const resItem of results) {
        const auditItem = await tx.inventoryAuditItem.update({
          where: { id: resItem.itemId },
          data: { countedQty: resItem.countedQty }
        });

        const diff = resItem.countedQty - auditItem.expectedQty;
        
        if (diff !== 0) {
          // Adjust stock
          await tx.inventory.upsert({
            where: { locationId_itemId: { locationId: audit.locationId, itemId: auditItem.itemId } },
            update: { quantity: resItem.countedQty },
            create: { locationId: audit.locationId, itemId: auditItem.itemId, quantity: resItem.countedQty }
          });

          // Adjust globalStock
          await tx.item.update({
            where: { id: auditItem.itemId },
            data: { globalStock: { increment: diff } } // If diff is negative, it decrements
          });

          // Kardex
          await tx.kardexMovement.create({
            data: {
              tipo: diff > 0 ? 'ENTRADA_COMPRA' : 'SALIDA_VENTA', // Equivalent
              cantidad: Math.abs(diff),
              locationDestinoId: diff > 0 ? audit.locationId : undefined,
              locationOrigenId: diff < 0 ? audit.locationId : undefined,
              itemId: auditItem.itemId,
              userId: req.body.userId || 'system',
              notes: `Ajuste por Conteo Cíclico ${audit.id} (Diferencia: ${diff})`
            }
          });
        }
      }

      const updatedAudit = await tx.inventoryAudit.update({
        where: { id: auditId },
        data: { status: 'COMPLETADO' }
      });

      return updatedAudit;
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deleteWarehouse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Verificar si tiene inventario
    const count = await prisma.inventory.count({ where: { locationId: id } });
    if (count > 0) {
      res.status(400).json({ success: false, error: 'No se puede eliminar un almacén con inventario asociado.' });
      return;
    }

    await prisma.location.delete({ where: { id } });
    res.json({ success: true, message: 'Almacén eliminado correctamente' });
  } catch (error: any) {
    if (error.code === 'P2003') {
      res.status(400).json({ success: false, error: 'No se puede eliminar el almacén porque tiene movimientos o auditorías asociadas.' });
      return;
    }
    next(error);
  }
};
