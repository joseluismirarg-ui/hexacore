// =============================================================================
// HEXA CORE SYSTEMS — src/routes/inventario.routes.ts
// =============================================================================
import { Router } from 'express';
import {
  getCamiones,
  getLiquidacion,
  getAlmacenes,
  registrarTraspaso,
  getKardex,
  getAllKardex,
} from '../controllers/inventario.controller';

const router = Router();

router.get('/almacenes', getAlmacenes);
router.get('/camiones', getCamiones);
router.get('/camiones/:id/liquidacion', getLiquidacion);
router.post('/traspaso', registrarTraspaso);
router.get('/kardex', getAllKardex);
router.get('/kardex/:itemId', getKardex);

export default router;
