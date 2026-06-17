// =============================================================================
// HEXA CORE SYSTEMS — src/routes/sales-order.routes.ts
// =============================================================================
import { Router } from 'express';
import { SalesOrderController } from '../controllers/sales-order.controller';

const router = Router();

router.post('/quote', SalesOrderController.quotePrices);
router.post('/', SalesOrderController.createOrder);
router.get('/', SalesOrderController.listOrders);
router.put('/:id/status', SalesOrderController.updateStatus);
router.post('/:id/dispatch', SalesOrderController.dispatchOrder);

export default router;
