import { Request, Response } from 'express';
import { stripe } from '../lib/stripe';
import { prisma } from '../lib/prisma';
import { clearTenantCache } from '../middleware/tenant.middleware';
import { getIO } from '../lib/socket';

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET');
    res.status(400).send('Webhook Secret Missing');
    return;
  }

  let event;
  try {
    // req.body MUST be raw Buffer here
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        if (customerId) {
          const tenant = await prisma.tenant.findFirst({
            where: { stripeCustomerId: customerId }
          });

          if (tenant) {
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);

            await prisma.tenant.update({
              where: { id: tenant.id },
              data: {
                status: 'ACTIVE',
                expiresAt: nextMonth
              }
            });

            clearTenantCache(tenant.id);

            // Notificar al Admin en vivo
            getIO().to('admin_room').emit('notification', {
              title: '💰 Pago Recibido',
              message: `El tenant ${tenant.name} ha procesado su pago exitosamente.`
            });

            console.log(`[Stripe Webhook] Payment succeeded for tenant ${tenant.id}. Extended to ${nextMonth.toISOString()}`);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        if (customerId) {
          const tenant = await prisma.tenant.findFirst({
            where: { stripeCustomerId: customerId }
          });

          if (tenant) {
            await prisma.tenant.update({
              where: { id: tenant.id },
              data: { status: 'SUSPENDED' }
            });

            clearTenantCache(tenant.id);

            getIO().to('admin_room').emit('notification', {
              title: '❌ Suscripción Cancelada',
              message: `El tenant ${tenant.name} ha cancelado su suscripción.`
            });

            console.log(`[Stripe Webhook] Subscription deleted for tenant ${tenant.id}. Status set to SUSPENDED.`);
          }
        }
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Processing error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
