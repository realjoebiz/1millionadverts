import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { ensureStats, prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

async function markPaid(session: Stripe.Checkout.Session) {
  const placementId = session.metadata?.placementId;
  if (!placementId) return;

  const existing = await prisma.placement.findUnique({ where: { id: placementId } });
  if (!existing || existing.status === 'paid') return;

  const pixels = existing.width * existing.height;
  const amount = session.amount_total ?? existing.amountPence;

  await prisma.$transaction([
    prisma.placement.update({
      where: { id: placementId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        stripeSessionId: session.id,
        amountPence: amount,
      },
    }),
    prisma.siteStat.update({
      where: { id: 1 },
      data: {
        soldPixels: { increment: pixels },
        revenuePence: { increment: amount },
      },
    }),
  ]);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.includes('replace')) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await ensureStats();
  if (event.type === 'checkout.session.completed') {
    await markPaid(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}
