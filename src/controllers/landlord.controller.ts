import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { clearTenantCache } from '../middleware/tenant.middleware';

export const getLandlordDashboard = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    if (user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Acceso denegado. Solo cuenta maestra.' });
    }

    const totalTenants = await prisma.tenant.count();
    const tenantsByIndustry = await prisma.tenant.groupBy({
      by: ['industry'],
      _count: { industry: true }
    });
    
    // Lista de tenants
    const tenantsList = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        industry: true,
        status: true,
        plan: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      metrics: {
        totalTenants,
        tenantsByIndustry: tenantsByIndustry.map(t => ({ name: t.industry, count: t._count.industry }))
      },
      tenants: tenantsList
    });
  } catch (error) {
    console.error('Error in getLandlordDashboard:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

export const setTenantStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = (req as any).user;
    if (user?.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { status }
    });

    // Invalidar caché
    clearTenantCache(id);

    res.json({ message: 'Estatus actualizado', tenant });
  } catch (error) {
    console.error('Error in setTenantStatus:', error);
    res.status(500).json({ error: 'Error al actualizar estatus' });
  }
};
