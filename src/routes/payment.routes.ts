// =============================================================================
// HEXA CORE SYSTEMS — src/routes/payment.routes.ts
// =============================================================================
import { Router } from 'express';
import { registrarPago, getPagosByCliente } from '../controllers/payment.controller';

const router = Router();

router.post('/', registrarPago);
router.get('/cliente/:customerId', getPagosByCliente);

export default router;
