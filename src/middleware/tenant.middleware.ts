import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { prisma } from '../lib/prisma';

export const tenantContext = new AsyncLocalStorage<string>();

// Simple in-memory cache for Tenant Status to prevent DB query overhead
const tenantStatusCache = new Map<string, { status: string; expiresAt: Date | null; cachedAt: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

// Rutas ignoradas por el validador estricto (ej. el checkout o el webhook no deben ser bloqueados)
const BYPASS_PATHS = [
  '/api/billing/webhook',
  '/api/tenants/onboarding',
  '/api/subscription/checkout',
  '/api/auth'
];

export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  let tenantId = req.headers['x-tenant-id'] as string;
  
  if (!tenantId) {
    if ((req as any).user && (req as any).user.tenantId) {
      tenantId = (req as any).user.tenantId;
    } else {
      tenantId = 'default-tenant';
    }
  }

  // Bypass para Webhooks o Endpoints públicos
  if (BYPASS_PATHS.some(p => req.path.startsWith(p))) {
    return tenantContext.run(tenantId, () => next());
  }

  // Validar Estatus de Cuenta para el resto de peticiones
  const now = Date.now();
  let status = 'ACTIVE';
  let expiresAt: Date | null = null;

  if (tenantId !== 'default-tenant') {
    const cached = tenantStatusCache.get(tenantId);
    
    if (cached && now - cached.cachedAt < CACHE_TTL) {
      status = cached.status;
      expiresAt = cached.expiresAt;
    } else {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { status: true, expiresAt: true }
      });
      
      if (tenant) {
        status = tenant.status;
        expiresAt = tenant.expiresAt;
        tenantStatusCache.set(tenantId, { status, expiresAt, cachedAt: now });
      }
    }

    if (status === 'SUSPENDED') {
      return res.status(403).json({ error: 'TENANT_SUSPENDED', message: 'Cuenta suspendida por falta de pago. Contacte a soporte.' });
    }

    if (status === 'PAST_DUE' || (expiresAt && new Date() > expiresAt && status === 'TRIAL')) {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        return res.status(403).json({ error: 'TENANT_READ_ONLY', message: 'Cuenta en mora. Acceso limitado a modo solo lectura.' });
      }
      // GET requests are allowed
    }
  }

  tenantContext.run(tenantId, () => {
    next();
  });
};

export const clearTenantCache = (tenantId: string) => {
  tenantStatusCache.delete(tenantId);
};
