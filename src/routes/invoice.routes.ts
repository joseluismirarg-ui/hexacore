// =============================================================================
// HEXA CORE SYSTEMS — src/routes/invoice.routes.ts
// =============================================================================
import { Router } from 'express';
import {
  timbrarFactura,
  listarFacturas,
  cancelarFactura,
  facturacionMasiva,
  stampRep
} from '../controllers/invoice.controller';

const router = Router();

router.get('/', listarFacturas);
router.post('/timbrar', timbrarFactura);
router.post('/rep', stampRep);
router.post('/masiva', facturacionMasiva);
router.patch('/:id/cancelar', cancelarFactura);

export default router;
