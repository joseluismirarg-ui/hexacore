import { PrismaClient, Prisma } from "@prisma/client";
import { tenantContext } from "../middleware/tenant.middleware";

const tenantModels = new Set(
  Prisma.dmmf.datamodel.models
    .filter(m => m.fields.some(f => f.name === 'tenantId'))
    .map(m => m.name)
);

const softDeleteModels = new Set(['Transaction', 'Customer', 'Item', 'Invoice']);

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const basePrisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  // Client extension for automatic tenant injection and Soft Deletes
  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantId = tenantContext.getStore();
          const isTenantModel = tenantModels.has(model as string);
          const isSoftDeleteModel = softDeleteModels.has(model as string);

          // DEBUG
          if (model === 'Item' && operation === 'findMany') {
            console.log(`[PRISMA_EXT] Item.findMany - tenantId from ALS:`, tenantId);
          }

          // 1. Soft Deletes Logic
          if (isSoftDeleteModel) {
            if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany') {
              (args as any).where = { ...(args as any).where, deletedAt: null };
            } else if (operation === 'delete') {
              return (basePrisma as any)[model].update({
                where: (args as any).where,
                data: { deletedAt: new Date() },
              });
            } else if (operation === 'deleteMany') {
              return (basePrisma as any)[model].updateMany({
                where: (args as any).where,
                data: { deletedAt: new Date() },
              });
            }
          }

          // 2. Tenant Injection Logic
          if (tenantId && tenantId !== 'default-tenant' && isTenantModel) {
            if (['findUnique', 'findFirst', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
              args = args || {};
              (args as any).where = { ...(args as any).where, tenantId };
            } else if (operation === 'create') {
              (args as any).data = { ...(args as any).data, tenantId };
            } else if (operation === 'createMany') {
              if (Array.isArray((args as any).data)) {
                (args as any).data = (args as any).data.map((d: any) => ({ ...d, tenantId }));
              } else {
                (args as any).data = { ...(args as any).data, tenantId };
              }
            } else if (operation === 'upsert') {
              (args as any).where = { ...(args as any).where, tenantId };
              (args as any).create = { ...(args as any).create, tenantId };
              (args as any).update = { ...(args as any).update, tenantId };
            }
          }

          return query(args);
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
