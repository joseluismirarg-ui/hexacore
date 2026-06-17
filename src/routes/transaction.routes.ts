// =============================================================================
// HEXA CORE SYSTEMS — src/routes/transaction.routes.ts
// =============================================================================

import { Router } from "express";
import {
  registrarTransaccion,
  getTransaccion,
  listarTransacciones,
} from "../controllers/transaction.controller";

const router = Router();

// POST /api/v1/transacciones/registrar
// Registra una nueva transacción de venta (directa, crédito o consignación).
// Admite header Idempotency-Key para garantizar exactamente una ejecución.
router.post("/registrar", registrarTransaccion);

// GET /api/v1/transacciones
// Lista transacciones con filtros opcionales: customerId, userId, status, tipo.
// Soporta paginación con ?page=1&limit=20
router.get("/", listarTransacciones);

// GET /api/v1/transacciones/:id
// Obtiene una transacción específica con todos sus items.
router.get("/:id", getTransaccion);

export default router;
