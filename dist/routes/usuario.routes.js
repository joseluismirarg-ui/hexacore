"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuario_controller_1 = require("../controllers/usuario.controller");
const tenantLimitsMiddleware_1 = require("../middleware/tenantLimitsMiddleware");
const router = (0, express_1.Router)();
router.get('/', usuario_controller_1.getAllUsers);
router.post('/', (0, tenantLimitsMiddleware_1.checkTenantLimit)('User'), usuario_controller_1.createUser);
router.put('/:id', usuario_controller_1.updateUser);
router.patch('/:id/suspend', usuario_controller_1.suspendUser);
router.get('/vendedores', usuario_controller_1.getVendedores);
exports.default = router;
//# sourceMappingURL=usuario.routes.js.map