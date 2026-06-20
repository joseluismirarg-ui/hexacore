import { Router } from 'express';
import { importItemsController, importCustomersController } from '../controllers/bulk-import.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// Middleware: Autenticación y luego Tenant
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rutas
router.post('/items', importItemsController);
router.post('/customers', importCustomersController);

export default router;
