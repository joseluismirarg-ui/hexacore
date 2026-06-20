import { Router } from 'express';
import { importItemsController, importCustomersController } from '../controllers/bulk-import.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// Middleware: Autenticación y luego Tenant
router.use(authenticateToken);
router.use(tenantMiddleware);

// Rutas
router.post('/items', importItemsController);
router.post('/customers', importCustomersController);

export default router;
