// =============================================================================
// HEXA CORE SYSTEMS — src/routes/logistics.routes.ts
// =============================================================================
import { Router } from 'express';
import { LogisticsController } from '../controllers/logistics.controller';

const router = Router();

router.post('/transfer', LogisticsController.createTransfer);
router.post('/transfer/:id/receive', LogisticsController.receiveTransfer);
router.get('/routes/optimize', LogisticsController.optimizeRoutes);

export default router;
