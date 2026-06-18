import { Router } from 'express';
import { 
  getEmployees, 
  createEmployee, 
  updateEmployee, 
  checkInOut, 
  getAttendanceDashboard, 
  registerRouteVisit, 
  getRouteVisits, 
  calculatePayroll, 
  requestLeave, 
  approveLeave 
} from '../controllers/hr.controller';

const router = Router();

// Directorio de Empleados
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);

// Asistencia
router.post('/attendance', checkInOut);
router.get('/attendance/dashboard', getAttendanceDashboard);

// Rutas (Vendedores)
router.post('/routes/visit', registerRouteVisit);
router.get('/routes/visits', getRouteVisits);

// Nómina y Permisos
router.get('/payroll', calculatePayroll);
router.post('/leave', requestLeave);
router.put('/leave/:id/approve', approveLeave);

export default router;
