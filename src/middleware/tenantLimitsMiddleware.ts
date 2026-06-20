import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export const checkTenantLimit = (entity: 'User' | 'Truck' | 'Location') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    // Solo aplica para POST (creaciones)
    if (req.method !== 'POST') return next();

    const tenantId = req.user?.tenantId;
    if (!tenantId || tenantId === 'default-tenant') return next();

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxUsers: true, maxTrucks: true, maxBranches: true }
      });

      if (!tenant) return next();

      if (entity === 'User') {
        const count = await prisma.user.count({ where: { tenantId } });
        if (count >= tenant.maxUsers) {
          return res.status(403).json({ error: 'LIMIT_EXCEEDED', message: `Límite de usuarios excedido. Máximo permitido: ${tenant.maxUsers}` });
        }
      }

      if (entity === 'Truck') {
        const count = await prisma.truck.count({ where: { tenantId } });
        if (count >= tenant.maxTrucks) {
          return res.status(403).json({ error: 'LIMIT_EXCEEDED', message: `Límite de camiones excedido. Máximo permitido: ${tenant.maxTrucks}` });
        }
      }

      if (entity === 'Location') {
        const count = await prisma.location.count({ where: { tenantId } });
        if (count >= tenant.maxBranches) {
          return res.status(403).json({ error: 'LIMIT_EXCEEDED', message: `Límite de sucursales excedido. Máximo permitido: ${tenant.maxBranches}` });
        }
      }

      next();
    } catch (error) {
      console.error('Error checking limits:', error);
      next();
    }
  };
};
