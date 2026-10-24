import { memo, useMemo, useState } from 'react';
import { SlidersHorizontal, X } from '@/assets/icons';
import {
  FAIRY_ATTRIBUTES,
  FAIRY_WALKS,
  type FairyWalk
} from '@constants/fairyCatalogue';
import type { FairyColor } from '@constants/fairyPieces';
import type { BoardCell } from '@app-types';
import { getPieceKey } from '@/shared/utils/pieceUtils';
import { namedCell, parseNamedCell } from '@/shared/utils/fairyCells';
import { usePieceImages } from '@/shared/hooks/usePieceImages';
import { DraggablePiece } from '../Board';
import { BUTTON, CHIP } from './controls';
import { SearchField } from './SearchField';
import { Segmented } from './Segmented';

interface FairyCatalogueProps {
  pieceStyle: string;
  selectedPiece: BoardCell | null;
  onSelect: (piece: BoardCell) => void;
  onKeyboardPick: (piece: BoardCell) => void;
}

const byCode = new Intl.Collator('en', { numeric: true }).compare;
const WALKS = FAIRY_WALKS.filter((walk) => !walk.glyph)
  .map((walk) => ({ walk, search: `${walk.name} ${walk.code}`.toLowerCase() }))
  .sort((a, b) => byCode(a.walk.code, b.walk.code));
const COLORS = [
  { value: 'w', label: 'White' },
  { value: 'b', label: 'Black' },
  { value: 'n', label: 'Neutral' }
] as const;
const COLOR_NAMES: Record<FairyColor, string> = {
  w: 'white',
  b: 'black',
  n: 'neutral'
};

export const FairyCatalogue = memo(function FairyCatalogue({
  pieceStyle,
  selectedPiece,
  onSelect,
  onKeyboardPick
}: FairyCatalogueProps) {
  const [color, setColor] = useState<FairyColor>('w');
  const [query, setQuery] = useState('');
  const [attributes, setAttributes] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const term = query.trim().toLowerCase();
  const entries = useMemo(
    () =>
      WALKS.filter(({ search }) => search.includes(term)).flatMap(
        ({ walk }) => {
          const piece = namedCell(color, walk.code, attributes);
          return parseNamedCell(piece) ? [{ walk, piece }] : [];
        }
      ),
    [term, color, attributes]
  );
  const visibleBoard = useMemo(
    () => [entries.map(({ piece }) => piece)],
    [entries]
  );
  const { pieceImages } = usePieceImages(pieceStyle, { board: visibleBoard });
  const prefix = attributes.length ? `${attributes.join(' ')} ` : '';

  const toggleAttribute = (attribute: string) =>
    setAttributes((current) =>
      current.includes(attribute)
        ? current.filter((value) => value !== attribute)
        : [...current, attribute]
    );

  const renderEntry = ({
    walk,
    piece
  }: {
    walk: FairyWalk;
    piece: BoardCell;
  }) => {
    const key = getPieceKey(piece);
    const image = key ? (pieceImages[key] ?? null) : null;
    return (
      <button
        key={walk.code}
        type="button"
        title={`${prefix}${walk.name} (${walk.code})`}
        aria-label={`Place ${COLOR_NAMES[color]} ${prefix}${walk.name} (${walk.code})`}
        aria-pressed={selectedPiece === piece}
        className="relative grid aspect-square min-w-0 cursor-pointer place-items-center rounded-md border border-border/50 bg-surface-elevated p-[6%] transition-colors hover:border-border hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-pressed:border-text-primary aria-pressed:bg-surface-hover"
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
          <span
            className="absolute top-1 right-1 size-1.5 rounded-full bg-accent"
            aria-hidden="true"
          />
        )}
        <DraggablePiece
          piece={piece}
          pieceImage={image}
          isFromPalette
          size="100%"
        />
      </button>
    );
  };

  return (
    <section aria-label="Named pieces" className="@container">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-text-muted">
          {entries.length} {term ? 'matching' : 'pieces'}
        </span>
        <Segmented
          label="Named piece colour"
          value={color}
          options={COLORS}
          onChange={setColor}
        />
      </header>

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <SearchField
            label="Search all named pieces"
            placeholder="Name or Popeye code"
            value={query}
            onChange={setQuery}
          />
        </div>
        <div>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((open) => !open)}
            className={`${BUTTON} ${attributes.length ? 'border-accent/60 text-accent' : ''}`}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            Attributes
            {attributes.length > 0 && (
              <span className="rounded-full bg-accent/15 px-1.5 font-mono text-[0.6875rem]">
                {attributes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          role="group"
          aria-label="Attributes for named pieces"
          className="mt-2 flex flex-wrap gap-1.5 rounded-lg border border-border/60 bg-bg/30 p-2"
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

      {attributes.length > 0 && !menuOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
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

      <div
        role="group"
        aria-label="Named fairy pieces"
        className="mt-3 grid grid-cols-6 gap-1 @md:grid-cols-8 @[36rem]:grid-cols-11"
      >
        {entries.map(renderEntry)}
        {entries.length === 0 && (
          <p className="col-span-full py-6 text-center text-xs text-text-secondary">
            No named piece matches “{query.trim()}”.
          </p>
        )}
      </div>
    </section>
  );
});
