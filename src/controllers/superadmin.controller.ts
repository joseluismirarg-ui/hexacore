import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export class SuperAdminController {
  
  static async listTenants(req: Request, res: Response): Promise<void> {
    try {
      const tenants = await prisma.tenant.findMany({
        include: {
          _count: {
            select: { users: true, trucks: true, locations: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: tenants });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateTenantConfig(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { maxUsers, maxBranches, maxTrucks, features, status } = req.body;

    try {
      const tenant = await prisma.tenant.update({
        where: { id },
        data: {
          ...(maxUsers !== undefined && { maxUsers }),
          ...(maxBranches !== undefined && { maxBranches }),
          ...(maxTrucks !== undefined && { maxTrucks }),
          ...(features !== undefined && { features }),
          ...(status !== undefined && { status }),
        }
      });

      // Registrar Auditoría
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: req.user!.id,
          tenantId: tenant.id,
          action: 'UPDATE_CONFIG',
          metadata: req.body,
          ipAddress: req.ip
        }
      });

      res.json({ success: true, data: tenant });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async impersonateTenant(req: Request, res: Response): Promise<any> {
    const { id } = req.params;

    try {
      const tenant = await prisma.tenant.findUnique({ where: { id } });
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

      if (!tenant.allowSupportAccess) {
        return res.status(403).json({ success: false, message: 'El inquilino no ha permitido acceso a soporte técnico.' });
      }

      // Generate a temporal token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 60);

      await prisma.supportToken.create({
        data: {
          tenantId: tenant.id,
          token: hashedToken,
          expiresAt
        }
      });

      // Devolvemos el raw token (solo se ve una vez)
      res.json({ 
        success: true, 
        message: 'Token de impersonación generado', 
        token: rawToken,
        expiresAt
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
