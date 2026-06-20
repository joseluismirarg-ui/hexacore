// =============================================================================
// HEXA CORE SYSTEMS — src/routes/manufacturing.routes.ts
// =============================================================================
import { Router } from 'express';
import { ManufacturingController } from '../controllers/manufacturing.controller';

const router = Router();

router.get('/bom', ManufacturingController.getBOMs);
router.post('/bom', ManufacturingController.createBOM);

router.get('/work-orders', ManufacturingController.getWorkOrders);
router.post('/work-orders', ManufacturingController.createWorkOrder);
router.post('/work-orders/start', ManufacturingController.startWorkOrder);
router.post('/work-orders/complete', ManufacturingController.completeWorkOrder);

export default router;
