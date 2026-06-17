// =============================================================================
// HEXA CORE SYSTEMS — src/routes/purchase.routes.ts
// =============================================================================
import { Router } from 'express';
import {
  crearOrdenCompra,
  listarOrdenesCompra,
  getOrdenCompra,
  recibirMercancia,
  listarProveedores,
  crearProveedor,
  generateMRPRecommendations,
} from '../controllers/purchase.controller';

const router = Router();

router.get('/proveedores', listarProveedores);
router.post('/proveedores', crearProveedor);
router.get('/mrp/recommendations', generateMRPRecommendations);
router.get('/', listarOrdenesCompra);
router.post('/', crearOrdenCompra);
router.get('/:id', getOrdenCompra);
router.post('/:id/recibir', recibirMercancia);

export default router;
