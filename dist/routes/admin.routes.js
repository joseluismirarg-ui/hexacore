"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/admin.routes.ts
// Rutas de Administración: Licencias de Módulos SaaS
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
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
exports.default = router;
//# sourceMappingURL=admin.routes.js.map