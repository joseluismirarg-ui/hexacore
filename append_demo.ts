import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { seedIndustryTemplates } from '../../prisma/giros.seed';

export const createDemoSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const demoId = `demo-${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours expiration

    // 1. Create temporary Tenant
    const demoTenant = await prisma.tenant.create({
      data: {
        name: `Demo en Vivo - ${demoId}`,
        industry: 'RETAIL',
        plan: 'PRO',
        status: 'TRIAL',
        expiresAt: expiresAt
      }
    });

    // 2. Inject Data
    await seedIndustryTemplates(prisma, demoTenant.id, 'RETAIL');

    // 3. Create Demo Admin User
    const demoUser = await prisma.user.create({
      data: {
        email: `demo@${demoId}.com`,
        name: 'Usuario Demo',
        passwordHash: await bcrypt.hash('demo123', 10),
        role: 'ADMIN',
        tenantId: demoTenant.id
      }
    });

    // 4. Create System Config
    await prisma.systemConfig.create({
      data: {
        tenantId: demoTenant.id,
        theme: 'light',
        language: 'es',
        timezone: 'America/Mexico_City'
      }
    });

    // 5. Generate JWT Token
    const token = jwt.sign(
      { 
        id: demoUser.id, 
        email: demoUser.email, 
        role: demoUser.role,
        tenantId: demoUser.tenantId
      },
      process.env.JWT_SECRET || 'super_secret',
      { expiresIn: '2h' }
    );

    res.json({ token, user: demoUser, tenant: demoTenant });
  } catch (error) {
    console.error('[Demo] Error creando sesión demo:', error);
    res.status(500).json({ error: 'Error creando la sesión demo' });
  }
};
