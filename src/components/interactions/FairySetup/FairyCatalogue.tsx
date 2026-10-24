import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, X } from '@/assets/icons';
import {
  FAIRY_ATTRIBUTES,
  FAIRY_WALKS,
  type FairyWalk
} from '@constants/fairyCatalogue';
import type { FairyColor } from '@constants/fairyPieces';
import type { BoardCell } from '@app-types';
import { fairyDiscSVG, namedCell } from '@/shared/utils/fairyCells';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { usePagination } from '@/shared/hooks/usePagination';
import { Pagination } from '@/shared/ui/Pagination/Pagination';
import { DraggablePiece } from '../Board';
import { BUTTON, CHIP } from './controls';
import { SearchField } from './SearchField';
import styles from './styles/fairy-catalogue.module.scss';

interface FairyCatalogueProps {
  color: FairyColor;
  selectedPiece: BoardCell | null;
  onSelect: (piece: BoardCell) => void;
  onKeyboardPick: (piece: BoardCell) => void;
}

const byCode = new Intl.Collator('en', { numeric: true }).compare;
const WALKS = [...FAIRY_WALKS]
  .sort((a, b) => byCode(a.code, b.code))
  .map((walk) => ({ walk, search: `${walk.code} ${walk.name}`.toLowerCase() }));
const PAGE_ROWS = 2;
const COLOR_NAMES: Record<FairyColor, string> = {
  w: 'white',
  b: 'black',
  n: 'neutral'
};

function discImage(color: FairyColor, code: string): HTMLImageElement {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fairyDiscSVG(color, code))}`;
  return image;
}

export const FairyCatalogue = memo(function FairyCatalogue({
  color,
  selectedPiece,
  onSelect,
  onKeyboardPick
}: FairyCatalogueProps) {
  const [storedAttributes, setAttributes] = useLocalStorage<string[]>(
    'fairy-named-attributes',
    []
  );
  const attributes: string[] = useMemo(
    () =>
      Array.isArray(storedAttributes)
        ? FAIRY_ATTRIBUTES.filter((value) => storedAttributes.includes(value))
        : [],
    [storedAttributes]
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(8);
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    let previousWidth = 0;
    const measure = (width: number) => {
      if (!width || width === previousWidth) return;
      previousWidth = width;
      setColumns(getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    };
    measure(grid.clientWidth);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) measure(entry.contentRect.width);
    });
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);
  const pageSize = columns * PAGE_ROWS;
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return WALKS.filter(({ search }) => search.includes(term));
  }, [query]);
  const { page, pageCount, goTo, next, prev, swipeHandlers } = usePagination(
    matches.length,
    pageSize
  );
  const start = Math.min(page, pageCount - 1) * pageSize;
  const visibleWalks = useMemo(
    () => matches.slice(start, start + pageSize),
    [matches, start, pageSize]
  );

  const entries = useMemo(
    () =>
      visibleWalks.map(({ walk }) => ({
        walk,
        piece: namedCell(color, walk.code, attributes)
      })),
    [visibleWalks, color, attributes]
  );
  const discs = useMemo(
    () =>
      Object.fromEntries(
        visibleWalks.map(({ walk }) => [walk.code, discImage(color, walk.code)])
      ),
    [visibleWalks, color]
  );
  const prefix = attributes.length ? `${attributes.join(' ')} ` : '';

  const toggleAttribute = (attribute: string) =>
    setAttributes(
      attributes.includes(attribute)
        ? attributes.filter((value) => value !== attribute)
        : [...attributes, attribute]
    );
  const searchPieces = (value: string) => {
    setQuery(value);
    goTo(0);
  };

  const renderEntry = ({
    walk,
    piece
  }: {
    walk: FairyWalk;
    piece: BoardCell;
  }) => {
    return (
      <button
        key={walk.code}
        type="button"
        title={`${prefix}${walk.name} (${walk.code})`}
        aria-label={`Place ${COLOR_NAMES[color]} ${prefix}${walk.name} (${walk.code})`}
        aria-pressed={selectedPiece === piece}
        className={styles.tile}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(piece);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            onKeyboardPick(piece);
          }
        }}
      >
        {attributes.length > 0 && (
          <span className={styles.badge} aria-hidden="true" />
        )}
        <DraggablePiece
          piece={piece}
          pieceImage={discs[walk.code] ?? null}
          isFromPalette
          size="100%"
        />
      </button>
    );
  };

  return (
    <section aria-label="Named pieces" className="contents">
      <div className="col-start-1 row-start-2 min-w-0 justify-self-start">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="true"
          onClick={() => setMenuOpen((open) => !open)}
          className={`${BUTTON} relative px-2 @[28rem]:px-3 ${attributes.length ? 'border-accent/60 text-accent' : ''}`}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          Attributes
          {attributes.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 rounded-full bg-surface-elevated px-1.5 font-mono text-[0.6875rem] text-accent ring-1 ring-border @[28rem]:static @[28rem]:bg-accent/15 @[28rem]:ring-0">
              {attributes.length}
            </span>
          )}
        </button>
      </div>
      <div className="col-span-2 col-start-1 row-start-3 min-w-0 @[28rem]:col-span-1 @[28rem]:col-start-2 @[28rem]:row-start-2">
        <SearchField
          label="Search named pieces"
          placeholder="Search name or code…"
          value={query}
          onChange={searchPieces}
        />
      </div>
      <div className="col-span-2 col-start-1 row-start-4 min-w-0 @[28rem]:row-start-3">
        {!menuOpen && attributes.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {attributes.map((attribute) => (
              <button
                key={attribute}
                type="button"
                aria-label={`Remove ${attribute}`}
                className={`${CHIP} h-7 border-accent/60 bg-accent/10 px-2.5 text-accent`}
                onClick={() => toggleAttribute(attribute)}
              >
                {attribute}
                <X className="size-3" aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              className="h-7 cursor-pointer rounded px-1.5 text-xs text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              onClick={() => setAttributes([])}
            >
              Clear
            </button>
          </div>
        )}

        {menuOpen && (
          <div
            role="group"
            aria-label="Attributes for named pieces"
            className="mb-2 flex flex-wrap gap-1.5 rounded-lg border border-border/60 bg-bg/30 p-2"
          >
            {FAIRY_ATTRIBUTES.map((attribute) => (
              <button
                key={attribute}
                type="button"
                aria-pressed={attributes.includes(attribute)}
                className={`${CHIP} h-7 px-2.5`}
                onClick={() => toggleAttribute(attribute)}
              >
                {attribute}
              </button>
            ))}
          </div>
        )}

        <div
          ref={gridRef}
          role="group"
          aria-label="Named fairy pieces"
          onKeyDown={(event) => {
            if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
            event.preventDefault();
            if (event.key === 'ArrowRight') next();
            else prev();
          }}
          {...swipeHandlers}
          className={styles.grid}
        >
          {entries.map(renderEntry)}
        </div>
        {matches.length === 0 && (
          <div className="py-4 text-center text-xs text-text-secondary">
            <p>No pieces match “{query}”.</p>
            <p className="mt-1">
              Try another name or code, or clear the search.
            </p>
          </div>
        )}
        <Pagination
          page={page}
          pageCount={pageCount}
          onChange={goTo}
          label="Named pieces pages"
          className="mt-3"
        />
      </div>
    </section>
  );
});
