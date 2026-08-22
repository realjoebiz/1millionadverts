import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('replace')) {
    throw new Error('Add STRIPE_SECRET_KEY to .env');
  }
  if (!client) client = new Stripe(key);
  return client;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
