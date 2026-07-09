import { memo, useCallback, useEffect, useState } from 'react';

import { usePagination } from '@hooks';
import type { PieceSet } from '@app-types';

import { Pagination } from '@ui';

// Constants
const DEFAULT_PIECE_ROWS = 2;

// Helpers
function colsForViewport(): number {
  if (typeof window === 'undefined') return 4;
  if (window.matchMedia('(min-width: 1024px)').matches) return 8; // lg
  if (window.matchMedia('(min-width: 640px)').matches) return 6; // sm
  return 4; // mobile
}

// Types
export interface PieceGridSharedProps {
  sets: PieceSet[];

  resetKey: string;
  pieceStyle: string;
  onSelect: (id: string) => void;

  rows?: number;
}

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
  const { page, pageCount, goTo, next, prev, swipeHandlers } = usePagination(
    sets.length,
    perPage
  );

  useEffect(() => {
    goTo(0);
  }, [resetKey, goTo]);

  const pageSets = sets.slice(page * perPage, (page + 1) * perPage);
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
                src={`/piece/${set.id}/wN.svg`}
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
        <Pagination
          page={page}
          pageCount={pageCount}
          onChange={goTo}
          label="Piece set pages"
        />
      )}
    </div>
  );
}

export const PieceGridShared = memo(PieceGridSharedComponent);
PieceGridShared.displayName = 'PieceGridShared';
