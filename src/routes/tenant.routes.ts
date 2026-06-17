import { Router } from 'express';
import { onboardingTenant, getCurrentTenantConfig } from '../controllers/tenant.controller';
// import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Si tuviéramos un middleware real de auth activado en esta fase:
// router.post('/onboarding', authMiddleware, onboardingTenant);
// router.get('/config', authMiddleware, getCurrentTenantConfig);

router.post('/onboarding', onboardingTenant);
router.get('/config', getCurrentTenantConfig);

export default router;
