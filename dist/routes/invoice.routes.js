"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/invoice.routes.ts
// =============================================================================
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const router = (0, express_1.Router)();
router.get('/', invoice_controller_1.listarFacturas);
router.post('/timbrar', invoice_controller_1.timbrarFactura);
router.post('/rep', invoice_controller_1.stampRep);
router.post('/masiva', invoice_controller_1.facturacionMasiva);
router.patch('/:id/cancelar', invoice_controller_1.cancelarFactura);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map