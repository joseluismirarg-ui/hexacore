// =============================================================================
// HEXA CORE SYSTEMS — src/routes/admin.routes.ts
// Rutas de Administración: Licencias de Módulos SaaS
// =============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

const router = Router();

// GET /api/admin/seed-test-pro — TEMPORARY ROUTE to create a pro test account
router.get('/seed-test-pro', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Hexa Core Pro Test',
        industry: 'GENERAL'
      }
    });

    const passwordHash = await bcrypt.hash('prueba1', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'prueba1@prueba1.com' },
      update: {
        passwordHash,
        tenantId: tenant.id,
        role: 'ADMIN'
      },
      create: {
        name: 'Administrador Pro',
        email: 'prueba1@prueba1.com',
        passwordHash,
        role: 'ADMIN',
        tenantId: tenant.id
      }
    });

    res.json({ success: true, message: 'Cuenta PRO creada', email: user.email, password: 'prueba1' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/licenses — Obtener la configuración de licencias
router.get('/licenses', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let license = await prisma.moduleLicense.findFirst();
    if (!license) {
      // Auto-crear si no existe
      license = await prisma.moduleLicense.create({
        data: {
          erpActive: true,
          posActive: true,
          hrActive: false,
          billingActive: false,
          logisticsActive: false,
          manufacturingActive: false,
          treasuryActive: false,
          reportsActive: false,
        },
      });
    }
    res.json({ success: true, data: license });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/licenses — Actualizar switches de módulos
router.put('/licenses', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      erpActive, posActive, hrActive, billingActive,
      logisticsActive, manufacturingActive, treasuryActive, reportsActive,
    } = req.body;

    let license = await prisma.moduleLicense.findFirst();
    if (!license) {
      license = await prisma.moduleLicense.create({
        data: {
          erpActive: erpActive ?? true,
          posActive: posActive ?? true,
          hrActive: hrActive ?? false,
          billingActive: billingActive ?? false,
          logisticsActive: logisticsActive ?? false,
          manufacturingActive: manufacturingActive ?? false,
          treasuryActive: treasuryActive ?? false,
          reportsActive: reportsActive ?? false,
        },
      });
    } else {
      license = await prisma.moduleLicense.update({
        where: { id: license.id },
        data: {
          ...(erpActive !== undefined && { erpActive }),
          ...(posActive !== undefined && { posActive }),
          ...(hrActive !== undefined && { hrActive }),
          ...(billingActive !== undefined && { billingActive }),
          ...(logisticsActive !== undefined && { logisticsActive }),
          ...(manufacturingActive !== undefined && { manufacturingActive }),
          ...(treasuryActive !== undefined && { treasuryActive }),
          ...(reportsActive !== undefined && { reportsActive }),
        },
      });
    }
    res.json({ success: true, data: license });
  } catch (error) {
    next(error);
  }
});

export default router;
