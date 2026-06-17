"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/transaction.routes.ts
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const router = (0, express_1.Router)();
// POST /api/v1/transacciones/registrar
// Registra una nueva transacción de venta (directa, crédito o consignación).
// Admite header Idempotency-Key para garantizar exactamente una ejecución.
router.post("/registrar", transaction_controller_1.registrarTransaccion);
// GET /api/v1/transacciones
// Lista transacciones con filtros opcionales: customerId, userId, status, tipo.
// Soporta paginación con ?page=1&limit=20
router.get("/", transaction_controller_1.listarTransacciones);
// GET /api/v1/transacciones/:id
// Obtiene una transacción específica con todos sus items.
router.get("/:id", transaction_controller_1.getTransaccion);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map