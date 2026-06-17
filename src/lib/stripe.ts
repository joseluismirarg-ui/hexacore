import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-05-27.dahlia' as any,
  appInfo: {
    name: 'Hexa Core Global',
    version: '1.0.0'
  }
});
