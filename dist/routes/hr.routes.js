"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hr_controller_1 = require("../controllers/hr.controller");
const router = (0, express_1.Router)();
// Directorio de Empleados
router.get('/employees', hr_controller_1.getEmployees);
router.post('/employees', hr_controller_1.createEmployee);
router.put('/employees/:id', hr_controller_1.updateEmployee);
// Asistencia
router.post('/attendance', hr_controller_1.checkInOut);
router.get('/attendance/dashboard', hr_controller_1.getAttendanceDashboard);
// Rutas (Vendedores)
router.post('/routes/visit', hr_controller_1.registerRouteVisit);
router.get('/routes/visits', hr_controller_1.getRouteVisits);
// Nómina y Permisos
router.get('/payroll', hr_controller_1.calculatePayroll);
router.post('/leave', hr_controller_1.requestLeave);
router.put('/leave/:id/approve', hr_controller_1.approveLeave);
exports.default = router;
//# sourceMappingURL=hr.routes.js.map