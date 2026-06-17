"use strict";
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/cobranza.routes.ts
// =============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cobranza_controller_1 = require("../controllers/cobranza.controller");
const router = (0, express_1.Router)();
// GET /api/v1/cobranza
// Lista todos los clientes con deuda activa, ordenados por deuda descendente.
// Soporta paginación con ?page=1&limit=20
router.get("/", cobranza_controller_1.getClientesConDeuda);
// POST /api/v1/cobranza/abonar
// Registra un abono a la deuda de un cliente. Reduce currentDebt de forma atómica.
// IMPORTANTE: Esta ruta debe ir ANTES de /:customerId para que Express
// no interprete "abonar" como un customerId.
router.post("/abonar", cobranza_controller_1.abonarDeuda);
// GET /api/v1/cobranza/:customerId
// Estado de cuenta detallado de un cliente: deuda, límite, últimas transacciones.
router.get("/:customerId", cobranza_controller_1.getEstadoCuenta);
exports.default = router;
//# sourceMappingURL=cobranza.routes.js.map