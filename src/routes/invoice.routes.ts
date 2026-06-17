// =============================================================================
// HEXA CORE SYSTEMS — src/routes/invoice.routes.ts
// =============================================================================
import { Router } from 'express';
import {
  timbrarFactura,
  listarFacturas,
  cancelarFactura,
  facturacionMasiva,
} from '../controllers/invoice.controller';

const router = Router();

router.get('/', listarFacturas);
router.post('/timbrar', timbrarFactura);
router.post('/masiva', facturacionMasiva);
router.patch('/:id/cancelar', cancelarFactura);

export default router;
