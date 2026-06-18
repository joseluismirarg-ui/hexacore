"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/inventario.routes.ts
// =============================================================================
const express_1 = require("express");
const inventario_controller_1 = require("../controllers/inventario.controller");
const router = (0, express_1.Router)();
router.get('/almacenes', inventario_controller_1.getAlmacenes);
router.get('/camiones', inventario_controller_1.getCamiones);
router.get('/camiones/:id/liquidacion', inventario_controller_1.getLiquidacion);
router.post('/traspaso', inventario_controller_1.registrarTraspaso);
router.get('/kardex', inventario_controller_1.getAllKardex);
router.get('/kardex/:itemId', inventario_controller_1.getKardex);
exports.default = router;
//# sourceMappingURL=inventario.routes.js.map