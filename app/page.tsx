import { ensureStats, prisma } from '@/lib/prisma';
import { TOTAL_PIXELS, formatGbp } from '@/lib/grid';
import { PixelBoard } from '@/components/PixelBoard';
import { ActivityFeed } from '@/components/ActivityFeed';
import { StatsBar } from '@/components/StatsBar';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await ensureStats();
  const [stats, placements] = await Promise.all([
    prisma.siteStat.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.placement.findMany({
      where: { status: 'paid' },
      orderBy: { paidAt: 'desc' },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#3dff9a]">1millionadverts.com</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          1,000,000 pixels.
          <span className="text-[#3dff9a]"> Buy yours.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base text-white/65 sm:text-lg">
          A public billboard that never scrolls away. Pick a block (min 10×10), drop your link, pay once.
          Price rises as the board fills.
        </p>
      </header>

      <StatsBar
        soldPixels={stats.soldPixels}
        remaining={TOTAL_PIXELS - stats.soldPixels}
        revenueLabel={formatGbp(stats.revenuePence)}
        advertisers={placements.length}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        <PixelBoard
          placements={placements.map((p) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            width: p.width,
            height: p.height,
            title: p.title,
            url: p.url,
            imageUrl: p.imageUrl,
            color: p.color,
          }))}
          soldPixels={stats.soldPixels}
        />
        <ActivityFeed
          items={placements.slice(0, 20).map((p) => ({
            id: p.id,
            title: p.title,
            url: p.url,
            amountPence: p.amountPence,
            width: p.width,
            height: p.height,
          }))}
        />
      </div>

      <footer className="mt-12 border-t border-white/10 pt-6 text-sm text-white/40">
        Pay once. Your block stays. Illegal or abusive placements can be removed.
      </footer>
    </div>
  );
}
