'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GRID_SIZE, MIN_BLOCK, formatGbp, pricePenceForPixels } from '@/lib/grid';

export type BoardPlacement = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  url: string;
  imageUrl: string | null;
  color: string;
};

type Draft = { x: number; y: number; width: number; height: number };

function snap(n: number) {
  return Math.floor(n / MIN_BLOCK) * MIN_BLOCK;
}

function clampDraft(d: Draft): Draft {
  let { x, y, width, height } = d;
  x = snap(Math.max(0, Math.min(x, GRID_SIZE - MIN_BLOCK)));
  y = snap(Math.max(0, Math.min(y, GRID_SIZE - MIN_BLOCK)));
  width = Math.max(MIN_BLOCK, snap(width) || MIN_BLOCK);
  height = Math.max(MIN_BLOCK, snap(height) || MIN_BLOCK);
  if (x + width > GRID_SIZE) width = Math.max(MIN_BLOCK, GRID_SIZE - x);
  if (y + height > GRID_SIZE) height = Math.max(MIN_BLOCK, GRID_SIZE - y);
  return { x, y, width: snap(width) || MIN_BLOCK, height: snap(height) || MIN_BLOCK };
}

export function PixelBoard({
  placements,
  soldPixels,
}: {
  placements: BoardPlacement[];
  soldPixels: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dragging, setDragging] = useState(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<BoardPlacement | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [color, setColor] = useState('#3dff9a');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displaySize = 640;
  const scale = displaySize / GRID_SIZE;
  const pixelCount = draft ? draft.width * draft.height : 0;
  const pricePence = draft ? pricePenceForPixels(pixelCount, soldPixels) : 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0e141c';
    ctx.fillRect(0, 0, displaySize, displaySize);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i <= GRID_SIZE; i += 50) {
      const p = i * scale;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, displaySize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(displaySize, p);
      ctx.stroke();
    }

    for (const p of placements) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = p.color || '#3dff9a';
      ctx.fillRect(p.x * scale, p.y * scale, p.width * scale, p.height * scale);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.strokeRect(p.x * scale, p.y * scale, p.width * scale, p.height * scale);
      if (p.width * scale >= 28 && p.height * scale >= 12) {
        ctx.fillStyle = '#07100c';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(p.title.slice(0, 16), p.x * scale + 3, p.y * scale + 11);
      }
    }

    if (draft) {
      ctx.fillStyle = 'rgba(61,255,154,0.28)';
      ctx.fillRect(draft.x * scale, draft.y * scale, draft.width * scale, draft.height * scale);
      ctx.strokeStyle = '#3dff9a';
      ctx.lineWidth = 2;
      ctx.strokeRect(draft.x * scale, draft.y * scale, draft.width * scale, draft.height * scale);
      ctx.lineWidth = 1;
    }
  }, [placements, draft, scale]);

  useEffect(() => {
    draw();
  }, [draw]);

  function toGrid(clientX: number, clientY: number) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(snap(((clientX - rect.left) / rect.width) * GRID_SIZE), GRID_SIZE - MIN_BLOCK)),
      y: Math.max(0, Math.min(snap(((clientY - rect.top) / rect.height) * GRID_SIZE), GRID_SIZE - MIN_BLOCK)),
    };
  }

  function findAt(gx: number, gy: number) {
    return (
      placements.find((p) => gx >= p.x && gx < p.x + p.width && gy >= p.y && gy < p.y + p.height) ?? null
    );
  }

  function onPointerDown(e: React.PointerEvent) {
    const { x, y } = toGrid(e.clientX, e.clientY);
    const hit = findAt(x, y);
    if (hit) {
      setHover(hit);
      setDraft(null);
      window.open(hit.url, '_blank', 'noopener,noreferrer');
      return;
    }
    setHover(null);
    origin.current = { x, y };
    setDraft(clampDraft({ x, y, width: MIN_BLOCK, height: MIN_BLOCK }));
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const { x, y } = toGrid(e.clientX, e.clientY);
    if (!dragging || !origin.current) {
      setHover(findAt(x, y));
      return;
    }
    const ox = origin.current.x;
    const oy = origin.current.y;
    setDraft(
      clampDraft({
        x: Math.min(ox, x),
        y: Math.min(oy, y),
        width: Math.max(ox, x) - Math.min(ox, x) + MIN_BLOCK,
        height: Math.max(oy, y) - Math.min(oy, y) + MIN_BLOCK,
      }),
    );
  }

  function onPointerUp() {
    setDragging(false);
    origin.current = null;
  }

  async function checkout() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x: draft.x,
          y: draft.y,
          width: draft.width,
          height: draft.height,
          title,
          url,
          imageUrl: imageUrl || null,
          color,
          email: email || null,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#121820]/80 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-white/50">
        <span>
          Drag empty space · min {MIN_BLOCK}×{MIN_BLOCK}
        </span>
        <span>1,000 × 1,000 board</span>
      </div>

      <div className="relative mx-auto w-full max-w-[640px]">
        <canvas
          ref={canvasRef}
          width={displaySize}
          height={displaySize}
          className="w-full cursor-crosshair touch-none rounded-lg border border-white/10 bg-[#0e141c]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {hover ? (
          <div className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-lg border border-white/10 bg-black/90 px-3 py-2 text-sm shadow-lg">
            <p className="font-medium text-[#3dff9a]">{hover.title}</p>
            <p className="truncate text-xs text-white/50">{hover.url}</p>
          </div>
        ) : null}
      </div>

      {draft ? (
        <div className="mt-4 space-y-3 rounded-xl border border-[#3dff9a]/30 bg-black/50 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-mono text-sm text-white/70">
              ({draft.x},{draft.y}) · {draft.width}×{draft.height} · {pixelCount.toLocaleString()} px
            </p>
            <p className="text-xl font-semibold text-[#3dff9a]">{formatGbp(pricePence)}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-white/50">Title</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#121820] px-3 py-2 outline-none focus:border-[#3dff9a]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                placeholder="Your brand"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/50">URL</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#121820] px-3 py-2 outline-none focus:border-[#3dff9a]"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yoursite.com"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/50">Image URL (optional)</span>
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#121820] px-3 py-2 outline-none focus:border-[#3dff9a]"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
            <label className="block text-sm">
              <span className="text-white/50">Email (receipt)</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#121820] px-3 py-2 outline-none focus:border-[#3dff9a]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm text-white/60">
            Block colour
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-8 w-12 cursor-pointer bg-transparent"
            />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || !title.trim() || !url.trim()}
              onClick={checkout}
              className="rounded-lg bg-[#3dff9a] px-5 py-2.5 text-sm font-semibold text-[#0b0f14] disabled:opacity-40"
            >
              {busy ? 'Redirecting…' : `Buy for ${formatGbp(pricePence)}`}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-white/45">
          Click and drag on empty space to claim pixels.
        </p>
      )}
    </div>
  );
}
