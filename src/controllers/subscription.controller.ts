import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { stripe } from '../lib/stripe';
import { tenantContext } from '../middleware/tenant.middleware';

const PLAN_PRICES: Record<string, string> = {
  BASIC: process.env.STRIPE_PRICE_BASIC || 'price_basic_placeholder',
  PRO: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder'
};

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plan } = req.body; // BASIC, PRO, ENTERPRISE
    const tenantId = tenantContext.getStore();

    if (!tenantId) {
      res.status(401).json({ error: 'No tenant context found' });
      return;
    }

    if (!plan || !PLAN_PRICES[plan]) {
      res.status(400).json({ error: 'Plan inválido' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ error: 'Tenant no encontrado' });
      return;
    }

    // Prepare Customer ID if doesn't exist
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: tenant.name,
        metadata: {
          tenantId: tenant.id
        }
      });
      customerId = customer.id;
      
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customerId }
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: PLAN_PRICES[plan],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/suscripcion`,
      metadata: {
        tenantId: tenant.id,
        plan
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error);
    res.status(500).json({ error: 'Error al iniciar pasarela de pago' });
  }
};
