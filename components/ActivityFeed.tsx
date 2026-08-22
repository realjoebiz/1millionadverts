import { formatGbp } from '@/lib/grid';

type Item = {
  id: string;
  title: string;
  url: string;
  amountPence: number;
  width: number;
  height: number;
};

export function ActivityFeed({ items }: { items: Item[] }) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-[#121820]/80 p-4">
      <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-white/45">Latest buys</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-white/40">Nobody yet. Be first.</p>
      ) : (
        <ul className="mt-4 max-h-[640px] space-y-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="border-b border-white/10 pb-3 last:border-0">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#3dff9a] hover:underline"
              >
                {item.title}
              </a>
              <p className="mt-1 font-mono text-xs text-white/40">
                {item.width}×{item.height} · {formatGbp(item.amountPence)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
