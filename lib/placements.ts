import { prisma } from './prisma';
import { isValidBlock, rectsOverlap, type Rect } from './grid';

export async function assertAvailable(rect: Rect) {
  if (!isValidBlock(rect.x, rect.y, rect.width, rect.height)) {
    throw new Error('Block must be at least 10×10 and snap to the 10px grid');
  }

  const candidates = await prisma.placement.findMany({
    where: { status: { in: ['paid', 'pending'] } },
    select: { x: true, y: true, width: true, height: true, status: true, createdAt: true },
  });

  const now = Date.now();
  const hit = candidates.find((p) => {
    if (!rectsOverlap(rect, p)) return false;
    if (p.status === 'paid') return true;
    return now - p.createdAt.getTime() < 35 * 60 * 1000;
  });

  if (hit) throw new Error('That space is already taken or reserved');
}
