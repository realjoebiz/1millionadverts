/** 1000×1000 = 1,000,000 pixels. Sold in 10×10-aligned blocks. */
export const GRID_SIZE = 1000;
export const TOTAL_PIXELS = GRID_SIZE * GRID_SIZE;
export const MIN_BLOCK = 10;
export const BASE_PENCE_PER_PIXEL = 1;

export type Rect = { x: number; y: number; width: number; height: number };

export function pricePenceForPixels(pixelCount: number, soldPixels: number): number {
  const fill = soldPixels / TOTAL_PIXELS;
  const multiplier = 1 + fill * 8 + fill * fill * 10;
  return Math.max(Math.ceil(pixelCount * BASE_PENCE_PER_PIXEL * multiplier), pixelCount);
}

export function formatGbp(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
}

export function isValidBlock(x: number, y: number, width: number, height: number): boolean {
  if (width < MIN_BLOCK || height < MIN_BLOCK) return false;
  if (x % MIN_BLOCK || y % MIN_BLOCK || width % MIN_BLOCK || height % MIN_BLOCK) return false;
  if (x < 0 || y < 0 || x + width > GRID_SIZE || y + height > GRID_SIZE) return false;
  return true;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.toString();
  } catch {
    return null;
  }
}
