"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/payment.routes.ts
// =============================================================================
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
router.post('/', payment_controller_1.registrarPago);
router.get('/cliente/:customerId', payment_controller_1.getPagosByCliente);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map