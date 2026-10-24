import { memo, useMemo, useState } from 'react';
import { ChevronDown } from '@/assets/icons';
import {
  FAIRY_ATTRIBUTES,
  FAIRY_WALKS,
  type FairyWalk
} from '@constants/fairyCatalogue';
import type { FairyColor, FairyRotation } from '@constants/fairyPieces';
import type { BoardCell } from '@app-types';
import { getPieceKey } from '@/shared/utils/pieceUtils';
import { namedCell, parseNamedCell } from '@/shared/utils/fairyCells';
import { usePieceImages } from '@/shared/hooks/usePieceImages';
import { DraggablePiece } from '../Board';
import { CHIP } from './controls';
import { SearchField } from './SearchField';
import { Segmented } from './Segmented';

interface FairyCatalogueProps {
  pieceStyle: string;
  rotation: FairyRotation;
  selectedPiece: BoardCell | null;
  onSelect: (piece: BoardCell) => void;
  onKeyboardPick: (piece: BoardCell) => void;
}

const byName = new Intl.Collator('en').compare;
const WALKS = FAIRY_WALKS.map((walk) => ({
  walk,
  turn: Number(walk.glyph?.slice(1) || 0),
  search: `${walk.name} ${walk.code}`.toLowerCase()
})).sort((a, b) => byName(a.walk.name, b.walk.name));
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
  rotation,
  selectedPiece,
  onSelect,
  onKeyboardPick
}: FairyCatalogueProps) {
  const [color, setColor] = useState<FairyColor>('w');
  const [query, setQuery] = useState('');
  const [attributes, setAttributes] = useState<string[]>([]);

  const entries = useMemo(() => {
    const term = query.trim().toLowerCase();
    return WALKS.filter(({ turn, search }) =>
      term ? search.includes(term) : turn === rotation
    ).flatMap(({ walk }) => {
      const piece = namedCell(color, walk.code, attributes);
      return parseNamedCell(piece) ? [{ walk, piece }] : [];
    });
  }, [query, rotation, color, attributes]);
  const visibleBoard = useMemo(
    () => [entries.map(({ piece }) => piece)],
    [entries]
  );
  const { pieceImages } = usePieceImages(pieceStyle, { board: visibleBoard });

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
        title={walk.name}
        aria-label={`Place ${COLOR_NAMES[color]} ${walk.name} (${walk.code})`}
        aria-pressed={selectedPiece === piece}
        className="flex min-w-0 cursor-pointer flex-col items-center rounded-md border border-border/50 bg-surface-elevated px-0.5 pt-1 pb-0.5 hover:border-border hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-pressed:border-text-primary aria-pressed:bg-surface-hover"
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
        <span className="grid aspect-square w-full place-items-center">
          <DraggablePiece
            piece={piece}
            pieceImage={image}
            isFromPalette
            size="88%"
          />
        </span>
        {walk.glyph && (
          <span className="font-mono text-[0.625rem] leading-tight text-text-muted">
            {walk.code}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-[0.075em] text-text-secondary uppercase">
          Named pieces · {entries.length}
          {!query.trim() && (
            <span className="ml-1 font-mono font-normal normal-case text-text-muted">
              {rotation ? `drawn at ${rotation}°` : 'upright and lettered'}
            </span>
          )}
        </span>
        <Segmented
          label="Named piece colour"
          value={color}
          options={COLORS}
          onChange={setColor}
        />
      </div>
      <SearchField
        label="Search all named pieces"
        placeholder={`Search ${FAIRY_WALKS.length} pieces by name or code`}
        value={query}
        onChange={setQuery}
      />
      <details className="group/attrs rounded-lg border border-border/60">
        <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded-lg px-3 text-xs text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
          <span className="flex-1">
            Attributes
            {attributes.length > 0 && (
              <span className="ml-1.5 text-accent">
                {attributes.join(', ')}
              </span>
            )}
          </span>
          <ChevronDown
            className="size-3.5 group-open/attrs:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <div
          role="group"
          aria-label="Attributes for named pieces"
          className="flex flex-wrap gap-1.5 border-t border-border/60 p-2"
        >
          {FAIRY_ATTRIBUTES.map((attribute) => (
            <button
              key={attribute}
              type="button"
              aria-pressed={attributes.includes(attribute)}
              className={`${CHIP} h-7 px-2.5`}
              onClick={() =>
                setAttributes((current) =>
                  current.includes(attribute)
                    ? current.filter((value) => value !== attribute)
                    : [...current, attribute]
                )
              }
            >
              {attribute}
            </button>
          ))}
        </div>
      </details>
      <div
        role="group"
        aria-label="Named fairy pieces"
        className="grid grid-cols-[repeat(auto-fill,minmax(3rem,1fr))] gap-1"
      >
        {entries.map(renderEntry)}
        {entries.length === 0 && (
          <p className="col-span-full py-6 text-center text-xs text-text-secondary">
            No named piece matches “{query.trim()}”.
          </p>
        )}
      </div>
    </div>
  );
});
