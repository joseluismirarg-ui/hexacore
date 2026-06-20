// =============================================================================
// HEXA CORE SYSTEMS — src/routes/admin.routes.ts
// Rutas de Administración: Licencias de Módulos SaaS
// =============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';

const router = Router();

// GET /api/admin/licenses — Obtener la configuración de licencias
router.get('/licenses', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || 'default-tenant';
    
    let license = await prisma.moduleLicense.findUnique({ where: { tenantId } });
    if (!license) {
      // Auto-crear si no existe
      license = await prisma.moduleLicense.create({
        data: {
          tenantId,
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

// PUT /api/admin/tenants/:id/licenses — Actualizar switches de módulos de un tenant específico
router.put('/tenants/:id/licenses', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.params.id;
    const {
      erpActive, posActive, hrActive, billingActive,
      logisticsActive, manufacturingActive, treasuryActive, reportsActive, tmsActive
    } = req.body;

    let license = await prisma.moduleLicense.findUnique({ where: { tenantId } });
    if (!license) {
      license = await prisma.moduleLicense.create({
        data: {
          tenantId,
          erpActive: erpActive ?? true,
          posActive: posActive ?? true,
          hrActive: hrActive ?? false,
          billingActive: billingActive ?? false,
          logisticsActive: logisticsActive ?? false,
          manufacturingActive: manufacturingActive ?? false,
          treasuryActive: treasuryActive ?? false,
          reportsActive: reportsActive ?? false,
          tmsActive: tmsActive ?? false,
        },
      });
    } else {
      license = await prisma.moduleLicense.update({
        where: { tenantId },
        data: {
          ...(erpActive !== undefined && { erpActive }),
          ...(posActive !== undefined && { posActive }),
          ...(hrActive !== undefined && { hrActive }),
          ...(billingActive !== undefined && { billingActive }),
          ...(logisticsActive !== undefined && { logisticsActive }),
          ...(manufacturingActive !== undefined && { manufacturingActive }),
          ...(treasuryActive !== undefined && { treasuryActive }),
          ...(reportsActive !== undefined && { reportsActive }),
          ...(tmsActive !== undefined && { tmsActive }),
        },
      });
    }
    res.json({ success: true, data: license });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/tenants — Crear una nueva empresa (Tenant) SaaS
router.post('/tenants', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, industry, plan, companyRfc, adminName, adminEmail, adminPassword } = req.body;

    if (!name || !adminName || !adminEmail || !adminPassword) {
      res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      return;
    }

    // 1. Validar si el email ya existe en Prisma
    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado.' });
      return;
    }

    // 2. Crear el Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name,
        industry: industry || 'GENERAL',
        plan: plan || 'FREE',
        status: 'ACTIVE',
      }
    });

    // 3. Crear el Administrador en Supabase Auth usando el API Admin
    const supabaseUrl = 'https://xlqdteghltctdorrpfdo.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      await prisma.tenant.delete({ where: { id: tenant.id } });
      res.status(500).json({ success: false, message: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor' });
      return;
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: adminName, role: 'ADMIN', tenantId: tenant.id }
    });

    if (authError || !authData?.user?.id) {
      // Si falla auth.users, eliminamos el tenant para mantener consistencia
      await prisma.tenant.delete({ where: { id: tenant.id } });
      res.status(500).json({ success: false, message: 'Error en Supabase: ' + (authError?.message || 'Desconocido') });
      return;
    }

    const authUserId = authData.user.id;

    // 4. Crear el Usuario Localmente en Prisma
    await prisma.user.create({
      data: {
        id: authUserId, // Sincronizar ID de Supabase
        email: adminEmail,
        name: adminName,
        role: 'ADMIN',
        tenantId: tenant.id,
        isActive: true
      }
    });

    // 5. Crear la Configuración del Sistema
    await prisma.systemConfig.create({
      data: {
        tenantId: tenant.id,
        companyName: name,
        companyRfc: companyRfc || 'XAXX010101000',
        taxRegimen: '601', // General de Ley Personas Morales
      }
    });

    // 6. Crear la licencia de módulos por defecto para el tenant
    await prisma.moduleLicense.create({
      data: {
        tenantId: tenant.id,
        erpActive: true,
        posActive: true,
      }
    });

    res.status(201).json({
      success: true,
      message: 'Empresa SaaS y Administrador creados exitosamente',
      data: tenant
    });
  } catch (error: any) {
    // Capturar errores de restricción única en auth.users si ocurren a nivel Postgres
    if (error.message?.includes('duplicate key value')) {
      res.status(400).json({ success: false, message: 'El correo electrónico ya existe en el sistema de Auth.' });
      return;
    }
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
        moduleLicense: true, // Para obtener licencias
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
    const userRole = (req as any).user?.role;
    
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Empresa no encontrada' });
      return;
    }

    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      res.status(403).json({ success: false, message: 'No autorizado para impersonar' });
      return;
    }

    // Generar un nuevo token que mantiene el userId del admin pero apunta al tenantId del cliente
    const token = jwt.sign(
      { userId: userId, role: userRole, tenantId: tenant.id, impersonated: true },
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
