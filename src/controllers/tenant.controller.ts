import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { tenantContext } from '../middleware/tenant.middleware';
import { seedIndustryTemplates } from '../lib/giros.seed';

export const onboardingTenant = async (req: Request, res: Response) => {
  const { name, industry } = req.body;
  const user = (req as any).user;

  try {
    // Escapar el contexto del tenant middleware para poder crear el tenant
    // prisma.$extends bypass for Tenant isn't totally necessary because Tenant model is excluded from dynamic filter,
    // but just to be safe if the user doesn't have a tenant yet.

    const newTenant = await prisma.tenant.create({
      data: {
        name,
        industry: industry || 'GENERAL',
      }
    });

    // Inyectar Catálogo según el Giro
    await seedIndustryTemplates(prisma as any, newTenant.id, industry);

    // Crear un SystemConfig default
    await prisma.systemConfig.create({
      data: {
        companyName: name,
        companyRfc: 'XAXX010101000',
        taxRegimen: '601',
        tenantId: newTenant.id
      }
    });

    // Precargar datos según giro
    if (industry === 'CONSTRUCTION') {
      await prisma.category.createMany({
        data: [
          { name: 'Aceros', tenantId: newTenant.id },
          { name: 'Cementos', tenantId: newTenant.id },
          { name: 'Maderas', tenantId: newTenant.id }
        ]
      });
    } else if (industry === 'RETAIL') {
      await prisma.category.createMany({
        data: [
          { name: 'Electrónica', tenantId: newTenant.id },
          { name: 'Ropa', tenantId: newTenant.id },
          { name: 'Hogar', tenantId: newTenant.id }
        ]
      });
    }

    // Actualizar al usuario que lo creó
    if (user && user.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: { tenantId: newTenant.id }
      });
    }

    res.status(201).json({ message: 'Tenant creado y preconfigurado', tenant: newTenant });
  } catch (error: any) {
    console.error('Error in onboardingTenant:', error);
    res.status(500).json({ error: 'Error al configurar la empresa' });
  }
};

export const getCurrentTenantConfig = async (req: Request, res: Response): Promise<any> => {
  try {
    const tenantId = tenantContext.getStore() || (req as any).user?.tenantId;
    if (!tenantId) {
       return res.status(401).json({ error: 'No tenant found in context' });
    }

    const role = (req as any).user?.role;

    if (tenantId === 'default-tenant' || role === 'SUPERADMIN') {
      res.json({ id: 'default-tenant', name: 'Super Admin Global', industry: 'GENERAL', status: 'ACTIVE' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    res.json(tenant);
  } catch (error: any) {
    console.error('Error in getCurrentTenantConfig:', error);
    res.status(500).json({ error: 'Error al obtener config del tenant' });
  }
};
