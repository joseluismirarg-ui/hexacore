import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2026-05-27.dahlia' as any,
});

// Definir los precios según lo solicitado
const TIERS = {
  BASIC: {
    monthly: 999,
    annual: 999 * 11, // 10989
  },
  PRO: {
    monthly: 2899,
    annual: 2899 * 11, // 31889
  },
  ENTERPRISE: {
    monthly: 4999,
    annual: 4999 * 11, // 54989
  }
};

export class StripeController {
  static async createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tier, billingCycle, tenantId } = req.body; // tenantId para saber a quién suscribir

      if (!tier || !billingCycle) {
        res.status(400).json({ error: 'tier y billingCycle son requeridos' });
        return;
      }

      const selectedTier = TIERS[tier as keyof typeof TIERS];
      if (!selectedTier) {
        res.status(400).json({ error: 'Tier inválido. Usa BASIC, PRO o ENTERPRISE' });
        return;
      }

      const amount = billingCycle === 'annual' ? selectedTier.annual : selectedTier.monthly;
      const productName = `Suscripción ${tier} - ${billingCycle === 'annual' ? 'Anual' : 'Mensual'}`;

      // Crear sesión de Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mxn',
              product_data: {
                name: productName,
                description: 'Acceso a la plataforma Hexacore ERP',
              },
              unit_amount: amount * 100, // Stripe usa centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment', // Se puede cambiar a 'subscription' si se crean los Productos/Precios en el Dashboard de Stripe previamente
        success_url: `${req.headers.origin || 'http://localhost:5173'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || 'http://localhost:5173'}/suscripcion?canceled=true`,
        client_reference_id: tenantId || 'anonymous_tenant', // Para identificar quién pagó en el webhook
      });

      res.status(200).json({ success: true, data: { url: session.url, sessionId: session.id } });
    } catch (error: any) {
      next(error);
    }
  }

  static async webhook(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      if (endpointSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Manejar el evento
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Aquí se activaría el tenant
        console.log(`Pago completado para el tenant: ${session.client_reference_id}`);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
}
