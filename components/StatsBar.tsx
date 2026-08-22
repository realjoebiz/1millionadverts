import { TOTAL_PIXELS } from '@/lib/grid';

export function StatsBar({
  soldPixels,
  remaining,
  revenueLabel,
  advertisers,
}: {
  soldPixels: number;
  remaining: number;
  revenueLabel: string;
  advertisers: number;
}) {
  const pct = Math.min(100, (soldPixels / TOTAL_PIXELS) * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121820]/70 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Sold" value={soldPixels.toLocaleString()} hint="pixels" />
        <Stat label="Left" value={remaining.toLocaleString()} hint="pixels" />
        <Stat label="Advertisers" value={String(advertisers)} hint="blocks" />
        <Stat label="Taken in" value={revenueLabel} hint="gross" />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-[#3dff9a]"
          style={{ width: `${Math.max(pct, pct > 0 ? 0.5 : 0)}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-xs text-white/40">
        {pct.toFixed(2)}% filled · price rises as it fills
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-white/35">{hint}</p>
    </div>
  );
}
