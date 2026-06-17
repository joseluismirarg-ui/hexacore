"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// =============================================================================
// HEXA CORE SYSTEMS — src/routes/product.routes.ts
// =============================================================================
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const router = (0, express_1.Router)();
router.get('/', product_controller_1.listarProductos);
router.get('/:id', product_controller_1.getProducto);
router.post('/', product_controller_1.crearProducto);
router.patch('/:id', product_controller_1.actualizarProducto);
router.delete('/:id', product_controller_1.eliminarProducto);
exports.default = router;
//# sourceMappingURL=product.routes.js.map