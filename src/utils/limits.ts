import { prisma } from '../lib/prisma';
import { ForbiddenError } from '../lib/errors';

export const PLAN_LIMITS = {
  FREE: { items: Infinity, locations: Infinity },
  BASIC: { items: 1000, locations: 1 },
  PRO: { items: 10000, locations: 5 },
  ENTERPRISE: { items: Infinity, locations: Infinity }
} as const;

export async function checkTenantLimits(tenantId: string, resource: 'ITEMS' | 'LOCATIONS'): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true }
  });

  if (!tenant) return; // Si no hay tenant (ej. superadmin root sin tenant asignado) no aplicamos límites.

  const plan = (tenant.plan as keyof typeof PLAN_LIMITS) || 'FREE';
  const limits = PLAN_LIMITS[plan];

  if (resource === 'ITEMS') {
    if (limits.items === Infinity) return;
    
    const currentItems = await prisma.item.count({
      where: { tenantId }
    });

    if (currentItems >= limits.items) {
      throw new ForbiddenError(`Límite del plan alcanzado. Tu plan ${plan} solo permite hasta ${limits.items} ítems. Por favor, actualiza tu plan.`);
    }
  }

  if (resource === 'LOCATIONS') {
    if (limits.locations === Infinity) return;
    
    const currentLocations = await prisma.location.count({
      where: { tenantId }
    });

    if (currentLocations >= limits.locations) {
      throw new ForbiddenError(`Límite del plan alcanzado. Tu plan ${plan} solo permite hasta ${limits.locations} ubicaciones. Por favor, actualiza tu plan.`);
    }
  }
}
