import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ensureStats, prisma } from '@/lib/prisma';
import { assertAvailable } from '@/lib/placements';
import { normalizeUrl, pricePenceForPixels } from '@/lib/grid';
import { getStripe, siteUrl } from '@/lib/stripe';

const bodySchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  width: z.number().int().min(10),
  height: z.number().int().min(10),
  title: z.string().trim().min(1).max(60),
  url: z.string().trim().min(1).max(500),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  email: z.string().trim().email().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const data = bodySchema.parse(await req.json());
    const url = normalizeUrl(data.url);
    if (!url) return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });

    let imageUrl: string | null = null;
    if (data.imageUrl) {
      imageUrl = normalizeUrl(data.imageUrl);
      if (!imageUrl) return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    await ensureStats();
    await assertAvailable({ x: data.x, y: data.y, width: data.width, height: data.height });

    const stats = await prisma.siteStat.findUniqueOrThrow({ where: { id: 1 } });
    const amountPence = pricePenceForPixels(data.width * data.height, stats.soldPixels);

    const placement = await prisma.placement.create({
      data: {
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        title: data.title,
        url,
        imageUrl,
        color: data.color ?? '#3dff9a',
        ownerEmail: data.email ?? null,
        amountPence,
        status: 'pending',
      },
    });

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      success_url: `${siteUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/?cancelled=1`,
      customer_email: data.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: amountPence,
            product_data: {
              name: `${data.width}×${data.height} pixels on 1 Million Adverts`,
              description: `${data.title} · (${data.x},${data.y})`,
            },
          },
        },
      ],
      metadata: { placementId: placement.id },
    });

    await prisma.placement.update({
      where: { id: placement.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'No checkout URL from Stripe' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    const status = /taken|reserved|Block|snap/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
