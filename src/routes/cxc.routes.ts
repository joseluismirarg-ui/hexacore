// =============================================================================
// HEXA CORE SYSTEMS — src/routes/cxc.routes.ts
// Rutas de Cuentas por Cobrar (CxC)
// =============================================================================

import { Router } from "express";
import { CxcController } from "../controllers/cxc.controller";

const router = Router();

// GET /api/v1/cxc/aging
// Retorna el reporte de antigüedad de saldos
router.get("/aging", CxcController.getAgingReport);

// POST /api/v1/cxc/payments
// Registra un pago y deduce deuda
router.post("/payments", CxcController.registerPayment);

export default router;
