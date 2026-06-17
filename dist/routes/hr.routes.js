"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hr_controller_1 = require("../controllers/hr.controller");
const router = (0, express_1.Router)();
router.post('/attendance', hr_controller_1.checkInOut);
router.get('/payroll', hr_controller_1.calculatePayroll);
exports.default = router;
//# sourceMappingURL=hr.routes.js.map