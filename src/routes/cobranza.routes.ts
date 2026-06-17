// =============================================================================
// HEXA CORE SYSTEMS — src/routes/cobranza.routes.ts
// =============================================================================

import { Router } from "express";
import {
  getEstadoCuenta,
  abonarDeuda,
  getClientesConDeuda,
} from "../controllers/cobranza.controller";

const router = Router();

// GET /api/v1/cobranza
// Lista todos los clientes con deuda activa, ordenados por deuda descendente.
// Soporta paginación con ?page=1&limit=20
router.get("/", getClientesConDeuda);

// POST /api/v1/cobranza/abonar
// Registra un abono a la deuda de un cliente. Reduce currentDebt de forma atómica.
// IMPORTANTE: Esta ruta debe ir ANTES de /:customerId para que Express
// no interprete "abonar" como un customerId.
router.post("/abonar", abonarDeuda);

// GET /api/v1/cobranza/:customerId
// Estado de cuenta detallado de un cliente: deuda, límite, últimas transacciones.
router.get("/:customerId", getEstadoCuenta);

export default router;
