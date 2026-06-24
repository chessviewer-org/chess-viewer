/** Largest number of dots drawn before a sliding window kicks in. Odd so the
 *  active dot can sit dead-centre with equal context on each side. */
export const MAX_VISIBLE_DOTS = 7;

/** One rendered slot in the dot row: a real page dot or a trimmed-edge marker. */
export type Slot =
  | { kind: 'dot'; page: number; tone: 'active' | 'normal' | 'faded' }
  | { kind: 'ellipsis'; side: 'start' | 'end' };

/**
 * Computes the visible dot slots for the current page.
 *
 * When every page fits, all dots render at full size. Once the count exceeds
 * {@link MAX_VISIBLE_DOTS}, a window slides to keep the active page centred and
 * an ellipsis marker stands in for the hidden pages on each trimmed edge.
 */
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
