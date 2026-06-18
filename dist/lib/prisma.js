"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const tenantModels = new Set(client_1.Prisma.dmmf.datamodel.models
    .filter(m => m.fields.some(f => f.name === 'tenantId'))
    .map(m => m.name));
const globalForPrisma = globalThis;
function createPrismaClient() {
    const basePrisma = new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
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
                    const tenantId = tenant_middleware_1.tenantContext.getStore();
                    if (tenantId) {
                        // Exclude models that don't have tenantId in their schema
                        if (tenantModels.has(model)) {
                            if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany' || operation === 'update' || operation === 'updateMany' || operation === 'delete' || operation === 'deleteMany') {
                                args.where = { ...args.where, tenantId };
                            }
                            else if (operation === 'create') {
                                args.data = { ...args.data, tenantId };
                            }
                            else if (operation === 'createMany') {
                                if (Array.isArray(args.data)) {
                                    args.data = args.data.map(d => ({ ...d, tenantId }));
                                }
                                else {
                                    args.data = { ...args.data, tenantId };
                                }
                            }
                            else if (operation === 'upsert') {
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
exports.prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
//# sourceMappingURL=prisma.js.map