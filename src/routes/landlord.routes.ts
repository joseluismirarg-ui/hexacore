import { Router } from 'express';
import { getLandlordDashboard, setTenantStatus } from '../controllers/landlord.controller';

const router = Router();

router.get('/dashboard', getLandlordDashboard);
router.post('/tenants/:id/suspend', setTenantStatus); // Body: { status: 'SUSPENDED' }

export default router;
