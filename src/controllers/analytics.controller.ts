import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tenantContext } from '../middleware/tenant.middleware';
import { Prisma } from '@prisma/client';

export const runPredictiveEngine = async (_req: Request, res: Response): Promise<any> => {
  try {
    const tenantId = tenantContext.getStore();
    if (!tenantId) return res.status(401).json({ error: 'No tenant context' });

    // 1. Limpiar alertas viejas de este tenant
    await prisma.predictiveStockAlert.deleteMany({
      where: { tenantId }
    });

    // 2. Obtener movimientos de los últimos 7 días (SALIDA_VENTA)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const movements = await prisma.kardexMovement.groupBy({
      by: ['itemId'],
      where: {
        tenantId,
        tipo: 'SALIDA_VENTA',
        timestamp: { gte: sevenDaysAgo }
      },
      _sum: { cantidad: true }
    });

    // 3. Analizar inventario actual de cada item afectado
    for (const mov of movements) {
      if (!mov._sum.cantidad) continue;

      // Velocidad diaria promedio
      const velocityRate = mov._sum.cantidad / 7;

      const inventory = await prisma.inventory.aggregate({
        where: { 
          item: { tenantId, id: mov.itemId }
        },
        _sum: { quantity: true }
      });

      const currentStock = inventory._sum.quantity || 0;
      
      let estimatedDaysLeft = 999;
      if (velocityRate > 0) {
        estimatedDaysLeft = Math.floor(currentStock / velocityRate);
      }

      // Si quedan menos de 5 días de stock, generamos la alerta
      if (estimatedDaysLeft <= 5) {
        await prisma.predictiveStockAlert.create({
          data: {
            tenantId,
            itemId: mov.itemId,
            currentStock,
            estimatedDaysLeft,
            velocityRate: new Prisma.Decimal(velocityRate)
          }
        });
      }
    }

    res.json({ message: 'Predictive engine run completed.' });
  } catch (error) {
    console.error('Error running predictive engine:', error);
    res.status(500).json({ error: 'Internal Error' });
  }
};

export const getPredictiveAlerts = async (_req: Request, res: Response): Promise<any> => {
  try {
    const tenantId = tenantContext.getStore();
    const alerts = await prisma.predictiveStockAlert.findMany({
      where: { tenantId },
      include: { item: true },
      orderBy: { estimatedDaysLeft: 'asc' }
    });

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal Error' });
  }
};
