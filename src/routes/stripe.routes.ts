import { Router } from 'express';
import { StripeController } from '../controllers/stripe.controller';

const router = Router();

router.post('/create-checkout-session', StripeController.createCheckoutSession);

export default router;
