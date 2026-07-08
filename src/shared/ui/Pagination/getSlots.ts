export const MAX_VISIBLE_DOTS = 7;

export type Slot =
  | { kind: 'dot'; page: number; tone: 'active' | 'normal' | 'faded' }
  | { kind: 'ellipsis'; side: 'start' | 'end' };

export function getSlots(page: number, pageCount: number): Slot[] {
  if (pageCount <= MAX_VISIBLE_DOTS) {
    return Array.from({ length: pageCount }, (_, i) => ({
      kind: 'dot',
      page: i,
      tone: i === page ? 'active' : 'normal'
    }));
  }

  const half = Math.floor(MAX_VISIBLE_DOTS / 2);
  let start = Math.max(0, page - half);
  const end = Math.min(pageCount - 1, start + MAX_VISIBLE_DOTS - 1);
  start = Math.max(0, end - MAX_VISIBLE_DOTS + 1);

  const slots: Slot[] = [];
  if (start > 0) slots.push({ kind: 'ellipsis', side: 'start' });

  for (let i = start; i <= end; i++) {
    const atEdge = i === start || i === end;
    slots.push({
      kind: 'dot',
      page: i,
      tone: i === page ? 'active' : atEdge ? 'faded' : 'normal'
    });
  }

  if (end < pageCount - 1) slots.push({ kind: 'ellipsis', side: 'end' });
  return slots;
}
