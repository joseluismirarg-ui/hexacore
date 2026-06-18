// =============================================================================
// HEXA CORE SYSTEMS — src/routes/admin.routes.ts
// Rutas de Administración: Licencias de Módulos SaaS
// =============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const router = Router();

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

// GET /api/admin/tenants — Obtener todas las empresas (Tenants) y su configuración
router.get('/tenants', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        systemConfigs: true, // Para obtener RFC, teléfono, dirección fiscal
        users: true, // Para contar o mostrar usuarios
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tenants });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/impersonate/:tenantId — Generar token para acceder a cuenta de cliente
router.post('/impersonate/:tenantId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantId } = req.params;
    const userId = (req as any).user?.id; // El admin que solicita
    
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Empresa no encontrada' });
      return;
    }

    const adminUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'No autorizado para impersonar' });
      return;
    }

    // Generar un nuevo token que mantiene el userId del admin pero apunta al tenantId del cliente
    const token = jwt.sign(
      { userId: adminUser.id, role: adminUser.role, tenantId: tenant.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '2h' } // Token temporal
    );

    res.json({
      success: true,
      message: `Impersonando a ${tenant.name}`,
      data: { token, tenantName: tenant.name }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
