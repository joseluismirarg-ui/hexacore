import { Router } from 'express';
import { SuperAdminController } from '../controllers/superadmin.controller';

const router = Router();

router.get('/tenants', SuperAdminController.listTenants);
router.patch('/tenants/:id/config', SuperAdminController.updateTenantConfig);
router.post('/tenants/:id/impersonate', SuperAdminController.impersonateTenant);

export default router;
