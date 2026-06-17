import { Router } from 'express';
import { stripeWebhook } from '../controllers/billing.controller';

const router = Router();

// Endpoint público para el webhook
router.post('/webhook', stripeWebhook);

export default router;
