"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/admin.routes.ts
// Rutas de Administración: Licencias de Módulos SaaS
// =============================================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
// GET /api/admin/licenses — Obtener la configuración de licencias
router.get('/licenses', async (_req, res, next) => {
    try {
        let license = await prisma_1.prisma.moduleLicense.findFirst();
        if (!license) {
            // Auto-crear si no existe
            license = await prisma_1.prisma.moduleLicense.create({
                data: {
                    erpActive: true,
                    posActive: true,
                    hrActive: false,
                    billingActive: false,
                    logisticsActive: false,
                    manufacturingActive: false,
                    treasuryActive: false,
                    reportsActive: false,
                },
            });
        }
        res.json({ success: true, data: license });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/admin/licenses — Actualizar switches de módulos
router.put('/licenses', async (req, res, next) => {
    try {
        const { erpActive, posActive, hrActive, billingActive, logisticsActive, manufacturingActive, treasuryActive, reportsActive, } = req.body;
        let license = await prisma_1.prisma.moduleLicense.findFirst();
        if (!license) {
            license = await prisma_1.prisma.moduleLicense.create({
                data: {
                    erpActive: erpActive ?? true,
                    posActive: posActive ?? true,
                    hrActive: hrActive ?? false,
                    billingActive: billingActive ?? false,
                    logisticsActive: logisticsActive ?? false,
                    manufacturingActive: manufacturingActive ?? false,
                    treasuryActive: treasuryActive ?? false,
                    reportsActive: reportsActive ?? false,
                },
            });
        }
        else {
            license = await prisma_1.prisma.moduleLicense.update({
                where: { id: license.id },
                data: {
                    ...(erpActive !== undefined && { erpActive }),
                    ...(posActive !== undefined && { posActive }),
                    ...(hrActive !== undefined && { hrActive }),
                    ...(billingActive !== undefined && { billingActive }),
                    ...(logisticsActive !== undefined && { logisticsActive }),
                    ...(manufacturingActive !== undefined && { manufacturingActive }),
                    ...(treasuryActive !== undefined && { treasuryActive }),
                    ...(reportsActive !== undefined && { reportsActive }),
                },
            });
        }
        res.json({ success: true, data: license });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/admin/tenants — Obtener todas las empresas (Tenants) y su configuración
router.get('/tenants', async (_req, res, next) => {
    try {
        const tenants = await prisma_1.prisma.tenant.findMany({
            include: {
                systemConfigs: true, // Para obtener RFC, teléfono, dirección fiscal
                users: true, // Para contar o mostrar usuarios
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: tenants });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/admin/impersonate/:tenantId — Generar token para acceder a cuenta de cliente
router.post('/impersonate/:tenantId', async (req, res, next) => {
    try {
        const { tenantId } = req.params;
        const userId = req.user?.id; // El admin que solicita
        const tenant = await prisma_1.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            res.status(404).json({ success: false, message: 'Empresa no encontrada' });
            return;
        }
        const adminUser = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!adminUser || adminUser.role !== 'ADMIN') {
            res.status(403).json({ success: false, message: 'No autorizado para impersonar' });
            return;
        }
        // Generar un nuevo token que mantiene el userId del admin pero apunta al tenantId del cliente
        const token = jsonwebtoken_1.default.sign({ userId: adminUser.id, role: adminUser.role, tenantId: tenant.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '2h' } // Token temporal
        );
        res.json({
            success: true,
            message: `Impersonando a ${tenant.name}`,
            data: { token, tenantName: tenant.name }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map