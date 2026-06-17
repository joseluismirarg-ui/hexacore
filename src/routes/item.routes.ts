// =============================================================================
// HEXA CORE SYSTEMS — src/routes/item.routes.ts
// =============================================================================
import { Router } from 'express';
import {
  listarProductos,
  getProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '../controllers/item.controller';

const router = Router();

router.get('/', listarProductos);
router.get('/:id', getProducto);
router.post('/', crearProducto);
router.patch('/:id', actualizarProducto);
router.delete('/:id', eliminarProducto);

export default router;
