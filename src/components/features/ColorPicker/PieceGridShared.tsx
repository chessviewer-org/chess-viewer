import { memo, useCallback, useEffect, useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { usePagedCarousel } from '@/pages/settings/usePagedCarousel';
import type { PieceSet } from '@app-types';

/** Default rows shown per page; columns come from the responsive breakpoint. */
const DEFAULT_PIECE_ROWS = 2;

/** Per-page column count for each Tailwind breakpoint (matches the grid below). */
function colsForViewport(): number {
  if (typeof window === 'undefined') return 4;
  if (window.matchMedia('(min-width: 1024px)').matches) return 8; // lg
  if (window.matchMedia('(min-width: 640px)').matches) return 6; // sm
  return 4; // mobile
}

/** Props for the shared, paged piece-set picker grid. */
export interface PieceGridSharedProps {
  sets: PieceSet[];
  /** Changing this (e.g. the sort mode) snaps the carousel back to page 1. */
  resetKey: string;
  pieceStyle: string;
  onSelect: (id: string) => void;
  /** Rows shown per page. Defaults to 2. */
  rows?: number;
}

/**
 * Visual piece-set picker: a paged, responsive grid of knight (wN) previews,
 * one per set, rendered from Lichess's piece CDN (allow-listed in the CSP
 * `img-src`). The selected set carries an accent ring; the parent decides what
 * the choice drives (Settings → `useBoardPieceSet`, ExportStudio → both the
 * board piece-set store AND `homeState.setPieceStyle`).
 *
 * Paging is circular (`usePagedCarousel`): on touch screens swipe left/right to
 * page (a swipe past either edge wraps around); on desktop the ◂ ▸ buttons and
 * Left/Right arrow keys do the same. Tiles start flush at the container edge —
 * no inset gutter — and fill the width responsively (4 / 6 / 8 columns).
 */
function PieceGridSharedComponent({
  sets,
  resetKey,
  pieceStyle,
  onSelect,
  rows = DEFAULT_PIECE_ROWS
}: PieceGridSharedProps) {
  const [cols, setCols] = useState(colsForViewport);

  useEffect(() => {
    const update = () => setCols(colsForViewport());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const perPage = cols * rows;
  const { page, pageCount, goTo, next, prev, swipeHandlers } = usePagedCarousel(
    sets.length,
    perPage
  );

  // Snap back to the first page when the ordering changes.
  useEffect(() => {
    goTo(0);
  }, [resetKey, goTo]);

  const pageSets = sets.slice(page * perPage, (page + 1) * perPage);
  // Pad last page with invisible placeholders so the grid always occupies the
  // same number of rows and the container height never shrinks on page change.
  const placeholderCount = perPage - pageSets.length;

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        next();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        prev();
        e.preventDefault();
      }
    },
    [next, prev]
  );

  const showPager = pageCount > 1;

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Piece set, use left and right arrow keys to page"
        tabIndex={0}
        onKeyDown={onKeyDown}
        {...swipeHandlers}
        className="touch-pan-y rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {pageSets.map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => onSelect(set.id)}
              // Don't take focus on pointer click, so no focus ring lingers after
              // selecting; keyboard focus (Tab) still shows the ring for a11y.
              onMouseDown={(e) => e.preventDefault()}
              aria-pressed={pieceStyle === set.id}
              aria-label={set.name}
              className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                pieceStyle === set.id
                  ? 'bg-accent/15'
                  : 'hover:bg-surface-elevated'
              }`}
            >
              <img
                src={`https://lichess1.org/assets/piece/${set.id}/wN.svg`}
                alt={set.name}
                width={44}
                height={44}
                className="h-11 w-11 object-contain"
                loading="lazy"
              />
              <span className="w-full truncate text-center text-[10px] font-semibold text-text-secondary">
                {set.name}
              </span>
            </button>
          ))}
          {Array.from({ length: placeholderCount }, (_, i) => (
            <div
              key={`ph-${i}`}
              aria-hidden="true"
              className="flex flex-col items-center gap-1 rounded-lg p-1.5 invisible"
            >
              <div className="h-11 w-11" />
              <span className="w-full text-center text-[10px] font-semibold">
                &nbsp;
              </span>
            </div>
          ))}
        </div>
      </div>

      {showPager && (
        <div className="flex items-center justify-center gap-3">
          {/* Arrow buttons — primarily for desktop/pointer; hidden from AT since
              the dots already expose page state. Swipe covers touch. */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous page"
            className="hidden rounded-md border border-border bg-surface p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Page ${i + 1} of ${pageCount}`}
                aria-current={page === i ? 'page' : undefined}
                className={`h-2 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  page === i
                    ? 'w-5 bg-accent'
                    : 'w-2 bg-border hover:bg-text-muted'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Next page"
            className="hidden rounded-md border border-border bg-surface p-1.5 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export const PieceGridShared = memo(PieceGridSharedComponent);
PieceGridShared.displayName = 'PieceGridShared';
