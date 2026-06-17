"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/purchase.routes.ts
// =============================================================================
const express_1 = require("express");
const purchase_controller_1 = require("../controllers/purchase.controller");
const router = (0, express_1.Router)();
router.get('/proveedores', purchase_controller_1.listarProveedores);
router.post('/proveedores', purchase_controller_1.crearProveedor);
router.get('/', purchase_controller_1.listarOrdenesCompra);
router.post('/', purchase_controller_1.crearOrdenCompra);
router.get('/:id', purchase_controller_1.getOrdenCompra);
router.post('/:id/recibir', purchase_controller_1.recibirMercancia);
exports.default = router;
//# sourceMappingURL=purchase.routes.js.map