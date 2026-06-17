"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/lib/prisma.ts
// Singleton de PrismaClient.
// En desarrollo, Next.js / ts-node-dev recarga módulos en cada cambio y puede
// crear múltiples instancias saturando el pool de conexiones de PostgreSQL.
// Almacenamos la instancia en globalThis para reutilizarla entre recargas.
// En producción (NODE_ENV=production) el módulo solo se carga una vez, por lo
// que el patrón de globalThis no aplica pero tampoco daña.
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
//# sourceMappingURL=prisma.js.map