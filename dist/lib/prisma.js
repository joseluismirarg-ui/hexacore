"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const tenant_middleware_1 = require("../middleware/tenant.middleware");
const tenantModels = new Set(client_1.Prisma.dmmf.datamodel.models
    .filter(m => m.fields.some(f => f.name === 'tenantId'))
    .map(m => m.name));
const softDeleteModels = new Set(['Transaction', 'Customer', 'Item', 'Invoice']);
const globalForPrisma = globalThis;
function createPrismaClient() {
    const basePrisma = new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
    // Client extension for automatic tenant injection and Soft Deletes
    return basePrisma.$extends({
        query: {
            $allModels: {
                async $allOperations({ model, operation, args, query }) {
                    const tenantId = tenant_middleware_1.tenantContext.getStore();
                    const isTenantModel = tenantModels.has(model);
                    const isSoftDeleteModel = softDeleteModels.has(model);
                    // 1. Soft Deletes Logic
                    if (isSoftDeleteModel) {
                        if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany') {
                            args.where = { deletedAt: null, ...args.where };
                        }
                        else if (operation === 'delete') {
                            return basePrisma[model].update({
                                where: args.where,
                                data: { deletedAt: new Date() },
                            });
                        }
                        else if (operation === 'deleteMany') {
                            return basePrisma[model].updateMany({
                                where: args.where,
                                data: { deletedAt: new Date() },
                            });
                        }
                    }
                    // 2. Tenant Injection Logic
                    if (tenantId && isTenantModel) {
                        if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany' || operation === 'update' || operation === 'updateMany' || operation === 'delete' || operation === 'deleteMany') {
                            args.where = { tenantId, ...args.where };
                        }
                        else if (operation === 'create') {
                            args.data = { tenantId, ...args.data };
                        }
                        else if (operation === 'createMany') {
                            if (Array.isArray(args.data)) {
                                args.data = args.data.map((d) => ({ tenantId, ...d }));
                            }
                            else {
                                args.data = { tenantId, ...args.data };
                            }
                        }
                        else if (operation === 'upsert') {
                            args.where = { tenantId, ...args.where };
                            args.create = { tenantId, ...args.create };
                            args.update = { tenantId, ...args.update };
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