import { PrismaClient } from "@prisma/client";
import { tenantContext } from "../middleware/tenant.middleware";

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
            // Exclude models that are global (like Tenant itself)
            if (model !== 'Tenant') {
              if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany' || operation === 'update' || operation === 'updateMany' || operation === 'delete' || operation === 'deleteMany') {
                args.where = { ...args.where, tenantId };
              } else if (operation === 'create') {
                args.data = { ...args.data, tenantId };
              } else if (operation === 'createMany') {
                if (Array.isArray(args.data)) {
                  args.data = args.data.map(d => ({ ...d, tenantId }));
                } else {
                  args.data = { ...args.data, tenantId };
                }
              } else if (operation === 'upsert') {
                args.where = { ...args.where, tenantId };
                args.create = { ...args.create, tenantId };
                args.update = { ...args.update, tenantId };
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
