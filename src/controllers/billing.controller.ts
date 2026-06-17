import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { clearTenantCache } from '../middleware/tenant.middleware';

export const stripeWebhook = async (req: Request, res: Response): Promise<any> => {
  // En producción, usamos stripe.webhooks.constructEvent con el payload crudo y firma
  // Aquí usaremos una simulación directa para propósitos del MVP
  
  try {
    const event = req.body;
    
    // Suponiendo que el webhook trae el id del cliente
    // { type: 'invoice.payment_succeeded', data: { object: { customer: 'cus_123', subscription: 'sub_123' } } }
    
    if (event.type === 'invoice.payment_succeeded') {
      const stripeCustomerId = event.data?.object?.customer;
      if (stripeCustomerId) {
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId }
        });

        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { 
              status: 'ACTIVE',
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
            }
          });
          clearTenantCache(tenant.id);
        }
      }
    } else if (event.type === 'invoice.payment_failed') {
      const stripeCustomerId = event.data?.object?.customer;
      if (stripeCustomerId) {
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId }
        });

        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { status: 'PAST_DUE' }
          });
          clearTenantCache(tenant.id);
        }
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).send('Webhook Error');
  }
};
