// =============================================================================
// HEXA CORE SYSTEMS — src/routes/manufacturing.routes.ts
// =============================================================================
import { Router } from 'express';
import { ManufacturingController } from '../controllers/manufacturing.controller';

const router = Router();

router.post('/bom', ManufacturingController.createBOM);
router.post('/production-order', ManufacturingController.processProductionOrder);

export default router;
