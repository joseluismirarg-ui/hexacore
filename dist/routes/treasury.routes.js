"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/treasury.routes.ts
// Rutas de Tesorería: Cuentas Bancarias y Movimientos Financieros
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const treasury_controller_1 = require("../controllers/treasury.controller");
const router = (0, express_1.Router)();
// GET /api/treasury/accounts — Listar todas las cuentas bancarias con sus movimientos
router.get('/accounts', async (_req, res, next) => {
    try {
        const accounts = await prisma_1.prisma.bankAccount.findMany({
            include: {
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                },
            },
            orderBy: { bankName: 'asc' },
        });
        res.json({ success: true, data: accounts });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/treasury/accounts/:id — Detalle de una cuenta con todos sus movimientos
router.get('/accounts/:id', async (req, res, next) => {
    try {
        const account = await prisma_1.prisma.bankAccount.findUnique({
            where: { id: req.params.id },
            include: {
                movements: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!account) {
            res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
            return;
        }
        res.json({ success: true, data: account });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/treasury/movements — Registrar un movimiento bancario (usa StringMath)
router.post('/movements', treasury_controller_1.TreasuryController.createMovement);
// GET /api/treasury/reconciliation — Conciliación Bancaria Automática
router.get('/reconciliation', treasury_controller_1.TreasuryController.getReconciliation);
// POST /api/treasury/cxp/pay — Cuentas por Pagar a Proveedor
router.post('/cxp/pay', treasury_controller_1.TreasuryController.paySupplier);
exports.default = router;
//# sourceMappingURL=treasury.routes.js.map