import { Router } from 'express';
import { createCheckoutSession } from '../controllers/subscription.controller';

const router = Router();

/**
 * @swagger
 * /api/subscription/checkout:
 *   post:
 *     summary: Crea una sesión de pago en Stripe
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *                 example: PRO
 *     responses:
 *       200:
 *         description: URL de la sesión de Checkout de Stripe
 */
router.post('/checkout', createCheckoutSession);

export default router;
