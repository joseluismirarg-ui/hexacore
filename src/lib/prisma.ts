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

          // 1. Soft Deletes Logic
          if (isSoftDeleteModel) {
            if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany') {
              (args as any).where = { deletedAt: null, ...(args as any).where };
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
          if (tenantId && isTenantModel) {
            if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany' || operation === 'update' || operation === 'updateMany' || operation === 'delete' || operation === 'deleteMany') {
              (args as any).where = { tenantId, ...(args as any).where };
            } else if (operation === 'create') {
              (args as any).data = { tenantId, ...(args as any).data };
            } else if (operation === 'createMany') {
              if (Array.isArray((args as any).data)) {
                (args as any).data = (args as any).data.map((d: any) => ({ tenantId, ...d }));
              } else {
                (args as any).data = { tenantId, ...(args as any).data };
              }
            } else if (operation === 'upsert') {
              (args as any).where = { tenantId, ...(args as any).where };
              (args as any).create = { tenantId, ...(args as any).create };
              (args as any).update = { tenantId, ...(args as any).update };
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
