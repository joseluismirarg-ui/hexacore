import { PrismaClient, Prisma } from "@prisma/client";
import { tenantContext } from "../middleware/tenant.middleware";

const tenantModels = new Set(
  Prisma.dmmf.datamodel.models
    .filter(m => m.fields.some(f => f.name === 'tenantId'))
    .map(m => m.name)
);

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

  // Client extension for automatic tenant injection
  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Si el modelo no tiene tenantId (ej. SystemConfig si decidieramos no tenerlo, aunque lo pusimos)
          // Asumimos que todos los modelos principales lo tienen, pero Prisma v5 nos permite inyectarlo dinámicamente
          const tenantId = tenantContext.getStore();

          if (tenantId) {
            // Exclude models that don't have tenantId in their schema
            if (tenantModels.has(model as string)) {
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
