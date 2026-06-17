"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cliente_controller_1 = require("../controllers/cliente.controller");
const router = (0, express_1.Router)();
router.get('/', cliente_controller_1.getClientes);
router.post('/', cliente_controller_1.createCustomer);
router.get('/consignaciones', cliente_controller_1.getClientesConsignacion);
exports.default = router;
//# sourceMappingURL=cliente.routes.js.map