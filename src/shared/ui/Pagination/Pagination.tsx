import { memo } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { getSlots } from './getSlots';

const DOT_TONE: Record<'active' | 'normal' | 'faded', string> = {
  active: 'bg-accent hover:bg-accent',
  normal: 'bg-border hover:bg-text-muted',
  faded: 'bg-border/60 hover:bg-border'
};

const DOT_SIZE: Record<
  'active' | 'normal' | 'faded',
  { width: number; height: number }
> = {
  active: { width: 20, height: 8 },
  normal: { width: 8, height: 8 },
  faded: { width: 6, height: 6 }
};

const ARROW_CLASS =
  'hidden shrink-0 rounded-md border border-border bg-surface p-1.5 ' +
  'text-text-secondary transition-colors hover:bg-surface-hover ' +
  'hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-accent sm:inline-flex';

export interface PaginationProps {
  /** Active page index (0-based). */
  page: number;
  /** Total number of pages. The component renders nothing when this is ≤ 1. */
  pageCount: number;
  /** Called with the next page index. Edge steps wrap around. */
  onChange: (page: number) => void;
  /** Accessible label for the surrounding nav landmark. */
  label?: string;
  className?: string;
}

/**
 * Compact, accessible page indicator: prev/next arrows (pointer + `sm` screens)
 * flanking a centred row of dots. The active dot widens into an accent pill; the
 * rest stay small. A sliding window caps the row at {@link MAX_VISIBLE_DOTS}
 * dots so even long lists never overflow narrow phone/tablet columns — the bug
 * the old per-call pagers hit was an unbounded dot row, not the pill itself.
 *
 * Stepping past either edge wraps, matching the swipe-to-page behaviour used by
 * the touch carousels that consume this component.
 */
const Pagination = memo(function Pagination({
  page,
  pageCount,
  onChange,
  label = 'Pagination',
  className = ''
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const goPrev = () => onChange((page - 1 + pageCount) % pageCount);
  const goNext = () => onChange((page + 1) % pageCount);

  return (
    <nav
      aria-label={label}
      className={`flex flex-row items-center justify-center gap-2 self-center ${className}`}
    >
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous page"
        className={ARROW_CLASS}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex flex-row items-center gap-1.5 self-center shrink-0">
        {getSlots(page, pageCount).map((slot) =>
          slot.kind === 'ellipsis' ? (
            <span
              key={`ellipsis-${slot.side}`}
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-border opacity-40"
            />
          ) : (
            <button
              key={slot.page}
              type="button"
              onClick={() => onChange(slot.page)}
              aria-label={`Page ${slot.page + 1} of ${pageCount}`}
              aria-current={slot.page === page ? 'page' : undefined}
              style={{
                flexShrink: 0,
                width: DOT_SIZE[slot.tone].width,
                height: DOT_SIZE[slot.tone].height,
                minWidth: DOT_SIZE[slot.tone].width,
                minHeight: DOT_SIZE[slot.tone].height,
                maxWidth: DOT_SIZE[slot.tone].width,
                maxHeight: DOT_SIZE[slot.tone].height,
                borderRadius: 9999,
                padding: 0,
                border: 'none'
              }}
              className={`transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${DOT_TONE[slot.tone]}`}
            />
          )
        )}
      </div>

      <button
        type="button"
        onClick={goNext}
        aria-label="Next page"
        className={ARROW_CLASS}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
});

Pagination.displayName = 'Pagination';
export default Pagination;
