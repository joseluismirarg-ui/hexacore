import { Router } from 'express';
import { handleStripeWebhook } from '../controllers/webhook.controller';

// Usa Router para modularidad, pero NO le apliques express.json()
const router = Router();

// Endpoint para recibir los eventos de Stripe
router.post('/stripe', handleStripeWebhook);

export default router;
