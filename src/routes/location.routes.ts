import { Router } from 'express';
import { getWarehouses, createWarehouse, getWarehouseDashboard, startAudit, completeAudit, deleteWarehouse } from '../controllers/location.controller';

const router = Router();

router.get('/', getWarehouses);
router.post('/', createWarehouse);
router.delete('/:id', deleteWarehouse);
router.get('/:id/dashboard', getWarehouseDashboard);
router.post('/audit/start', startAudit);
router.post('/audit/complete', completeAudit);

export default router;
