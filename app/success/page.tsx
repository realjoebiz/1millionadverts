import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';
import { formatGbp } from '@/lib/grid';

export const dynamic = 'force-dynamic';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  let heading = 'Payment received';
  let detail = 'Your pixels will appear once Stripe confirms.';

  if (searchParams.session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(searchParams.session_id);
      const placementId = session.metadata?.placementId;
      if (placementId) {
        const placement = await prisma.placement.findUnique({ where: { id: placementId } });
        if (placement) {
          heading = `You own ${placement.width}×${placement.height} pixels`;
          detail = `${placement.title} · ${formatGbp(placement.amountPence)} · (${placement.x},${placement.y})`;
        }
      }
    } catch {
      // keep defaults
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#3dff9a]">1 Million Adverts</p>
      <h1 className="mt-3 text-3xl font-semibold">{heading}</h1>
      <p className="mt-3 text-white/60">{detail}</p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit rounded-lg bg-[#3dff9a] px-5 py-2.5 text-sm font-semibold text-[#0b0f14]"
      >
        Back to the board
      </Link>
    </div>
  );
}
