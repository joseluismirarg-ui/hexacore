import { Router } from 'express';
import { checkInOut, calculatePayroll, requestLeave, approveLeave } from '../controllers/hr.controller';

const router = Router();

router.post('/attendance', checkInOut);
router.get('/payroll', calculatePayroll);
router.post('/leave', requestLeave);
router.put('/leave/:id/approve', approveLeave);

export default router;
