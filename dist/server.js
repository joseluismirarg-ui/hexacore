"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/server.ts
// Bootstrap del servidor HTTP.
// Conecta Prisma, levanta Express y maneja shutdown graceful ante SIGTERM/SIGINT.
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./lib/socket");
const prisma_1 = require("./lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const PORT = 3000;
const HOST = "0.0.0.0";
async function bootstrap() {
    try {
        // ── Verificar conexión a PostgreSQL antes de abrir el puerto ────────────
        await prisma_1.prisma.$connect();
        console.log("[DB]     Conexión a PostgreSQL establecida ✓");
        // ── Auto-Seeding: Crear Super Admin si la tabla está vacía ──────────────
        const userCount = await prisma_1.prisma.user.count();
        if (userCount === 0) {
            console.log("[DB]     Base de datos vacía detectada. Creando Super Admin inicial...");
            const passwordHash = await bcrypt_1.default.hash("AdminHexa2026", 10);
            const defaultTenant = await prisma_1.prisma.tenant.upsert({
                where: { id: "default-tenant" },
                update: {},
                create: {
                    id: "default-tenant",
                    name: "Hexa Core Global",
                    industry: "SaaS",
                    plan: "ENTERPRISE",
                    status: "ACTIVE",
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            });
            await prisma_1.prisma.user.create({
                data: {
                    email: "admin@hexacore.com",
                    name: "Super Admin",
                    passwordHash,
                    role: "ADMIN",
                    isActive: true,
                    tenantId: defaultTenant.id,
                },
            });
            console.log("[DB]     Super Admin creado exitosamente. (admin@hexacore.com)");
        }
        const server = app_1.default.listen(PORT, HOST, () => {
            console.log(`[SERVER] Hexa Core API → http://${HOST}:${PORT}`);
            console.log(`[SERVER] Entorno  : ${process.env.NODE_ENV ?? "development"}`);
            console.log(`[SERVER] Health   : http://localhost:${PORT}/health`);
        });
        // Initialize WebSockets
        (0, socket_1.initSocket)(server);
        // ── Graceful shutdown ───────────────────────────────────────────────────
        // Cerramos el servidor HTTP primero (deja de aceptar nuevas conexiones),
        // luego desconectamos Prisma para liberar el pool de conexiones.
        const shutdown = async (signal) => {
            console.log(`\n[SERVER] Señal ${signal} recibida — iniciando shutdown graceful...`);
            server.close(async () => {
                console.log("[SERVER] Servidor HTTP cerrado — no se aceptan nuevas conexiones");
                try {
                    await prisma_1.prisma.$disconnect();
                    console.log("[DB]     Pool de conexiones cerrado ✓");
                }
                catch (disconnectErr) {
                    console.error("[DB]     Error al desconectar Prisma:", disconnectErr);
                }
                finally {
                    process.exit(0);
                }
            });
            // Forzar salida si el shutdown tarda más de 15 segundos
            setTimeout(() => {
                console.error("[SERVER] Shutdown forzado — timeout de 15s excedido");
                process.exit(1);
            }, 15_000).unref();
        };
        process.on("SIGTERM", () => void shutdown("SIGTERM"));
        process.on("SIGINT", () => void shutdown("SIGINT"));
        // ── Manejo de promesas rechazadas no capturadas ─────────────────────────
        process.on("unhandledRejection", (reason, promise) => {
            console.error("[PROCESS] Unhandled Rejection en:", promise, "razón:", reason);
        });
        process.on("uncaughtException", (err) => {
            console.error("[PROCESS] Uncaught Exception:", err);
            void shutdown("uncaughtException");
        });
    }
    catch (err) {
        console.error("[SERVER] Error fatal en bootstrap:", err);
        await prisma_1.prisma.$disconnect();
        process.exit(1);
    }
}
void bootstrap();
//# sourceMappingURL=server.js.map