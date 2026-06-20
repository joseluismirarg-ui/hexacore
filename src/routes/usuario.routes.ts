import { Router } from 'express';
import { getVendedores, getAllUsers, createUser, updateUser, suspendUser } from '../controllers/usuario.controller';

import { checkTenantLimit } from '../middleware/tenantLimitsMiddleware';

const router = Router();

router.get('/', getAllUsers);
router.post('/', checkTenantLimit('User'), createUser);
router.put('/:id', updateUser);
router.patch('/:id/suspend', suspendUser);

router.get('/vendedores', getVendedores);

export default router;
