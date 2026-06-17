"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const warehouse_controller_1 = require("../controllers/warehouse.controller");
const router = (0, express_1.Router)();
router.get('/', warehouse_controller_1.getWarehouses);
router.post('/', warehouse_controller_1.createWarehouse);
router.get('/:id/dashboard', warehouse_controller_1.getWarehouseDashboard);
exports.default = router;
//# sourceMappingURL=warehouse.routes.js.map