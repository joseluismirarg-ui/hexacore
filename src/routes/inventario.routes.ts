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

// Bloqueo explícito de mutaciones históricas (Kardex inmutable)
router.put('/kardex/:id', (_req, res) => res.status(405).json({ error: 'Kardex is IMMUTABLE. Updates are strictly forbidden.' }));
router.delete('/kardex/:id', (_req, res) => res.status(405).json({ error: 'Kardex is IMMUTABLE. Deletions are strictly forbidden.' }));
router.patch('/kardex/:id', (_req, res) => res.status(405).json({ error: 'Kardex is IMMUTABLE. Patches are strictly forbidden.' }));

export default router;
