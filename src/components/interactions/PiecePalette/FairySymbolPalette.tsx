import { memo, useId, useMemo, useState } from 'react';
import { ArrowLeft } from '@/assets/icons';
import {
  FAIRY_ROTATIONS,
  type FairyColor,
  type FairyPieceType,
  type FairyRotation
} from '@constants/fairyPieces';
import type { BoardCell } from '@app-types';
import { cellName, parseCellCode, symbolCell } from '@/shared/utils/boardCells';
import { parseNamedCell } from '@/shared/utils/fairyCells';
import { positionContext, validateFEN } from '@/shared/utils/fenParser';
import { getPieceKey } from '@/shared/utils/pieceUtils';
import { usePieceImages } from '@/shared/hooks/usePieceImages';
import { FairyCatalogue } from '../FairySetup/FairyCatalogue';
import { FairyProblem } from '../FairySetup/FairyProblem';
import { Segmented } from '../FairySetup/Segmented';
import { PiecePalette, type PaletteGroup } from './PiecePalette';

interface FairySymbolPaletteProps {
  fen: string;
  pieceStyle: string;
  selectedPiece: BoardCell | null;
  onSelect: (piece: BoardCell) => void;
  onKeyboardPick: (piece: BoardCell) => void;
  onFenChange: (fen: string) => void;
}

const PIECES: readonly FairyPieceType[] = ['K', 'Q', 'R', 'B', 'N', 'P'];
const MARKERS: readonly FairyPieceType[] = ['C', 'X', 'S', 'T'];
const COLORS: readonly { color: FairyColor; label: string }[] = [
  { color: 'w', label: 'White' },
  { color: 'b', label: 'Black' },
  { color: 'n', label: 'Neutral' }
];
const TABS = [
  { id: 'pieces', label: 'Pieces' },
  { id: 'problem', label: 'Problem' }
] as const;
type PaletteTab = (typeof TABS)[number]['id'];
const ROTATION_OPTIONS = FAIRY_ROTATIONS.map((value) => ({
  value: String(value) as `${FairyRotation}`,
  label: `${value}°`,
  title: value ? `Turned ${value}° clockwise` : 'Upright'
}));

function entry(
  color: FairyColor,
  type: FairyPieceType,
  rotation: FairyRotation
) {
  const piece = symbolCell(color, type, rotation);
  return { piece, name: cellName(piece) };
}

const DOTS: Record<FairyColor, string> = {
  w: 'bg-white',
  b: 'bg-black',
  n: 'bg-linear-to-r from-white from-50% to-black to-50%'
};

function pieceGroups(rotation: FairyRotation): PaletteGroup[] {
  return COLORS.map(({ color, label }) => ({
    label,
    entries: PIECES.map((type) => entry(color, type, rotation))
  }));
}

export const FairySymbolPalette = memo(function FairySymbolPalette({
  fen,
  pieceStyle,
  selectedPiece,
  onSelect,
  onKeyboardPick,
  onFenChange
}: FairySymbolPaletteProps) {
  const id = useId();
  const [tab, setTab] = useState<PaletteTab>('pieces');
  const [rotation, setRotation] = useState<FairyRotation>(0);
  const [markerColor, setMarkerColor] = useState<FairyColor>('w');
  const groups: PaletteGroup[] = [
    ...pieceGroups(rotation),
    {
      label: 'Markers',
      entries: MARKERS.map((type) => entry(markerColor, type, rotation)),
      trail: (
        <>
          <span
            className="grid min-w-0 place-items-center text-accent"
            aria-hidden="true"
          >
            <ArrowLeft className="size-1/2" />
          </span>
          <div
            role="group"
            aria-label="Marker colour"
            className="flex aspect-square min-w-0 flex-col items-stretch justify-evenly rounded-md border border-border/50 bg-surface-elevated px-[18%]"
          >
            {COLORS.map(({ color, label }) => (
              <button
                key={color}
                type="button"
                title={`${label} markers`}
                aria-label={`${label} markers`}
                aria-pressed={markerColor === color}
                onClick={() => restyle(color, rotation)}
                className="h-[26%] min-h-0! min-w-0! cursor-pointer rounded-full border border-border p-px opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:border-accent aria-pressed:border-2 aria-pressed:border-accent aria-pressed:opacity-100"
              >
                <span
                  className={`block size-full rounded-full ${DOTS[color]}`}
                />
              </button>
            ))}
          </div>
        </>
      )
    }
  ];
  const visibleBoard = groups.map(({ entries }) =>
    entries.map(({ piece }) => piece)
  );
  const { pieceImages, error } = usePieceImages(pieceStyle, {
    board: visibleBoard
  });
  const stipulation = useMemo(
    () =>
      validateFEN(fen)
        ? positionContext(fen).commands?.find(({ keyword }) =>
            ['stipulation', 'sstipulation'].includes(keyword)
          )?.value
        : undefined,
    [fen]
  );

  function restyle(nextMarkerColor: FairyColor, nextRotation: FairyRotation) {
    setMarkerColor(nextMarkerColor);
    setRotation(nextRotation);
    if (!selectedPiece || parseNamedCell(selectedPiece)) return;
    const code = parseCellCode(getPieceKey(selectedPiece) ?? '');
    if (!code) return;
    const marker = MARKERS.includes(code.type);
    const next = symbolCell(
      marker ? nextMarkerColor : code.color,
      code.type,
      nextRotation
    );
    if (next !== selectedPiece) onSelect(next);
  }

  return (
    <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Fairy palette" className="flex gap-3">
          {TABS.map(({ id: value, label }, index) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`${id}-${value}-tab`}
              aria-controls={`${id}-${value}-panel`}
              aria-selected={tab === value}
              tabIndex={tab === value ? 0 : -1}
              className="flex h-8 cursor-pointer items-center gap-1.5 border-b-2 border-transparent text-xs font-semibold tracking-wide text-text-secondary uppercase hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-selected:border-accent aria-selected:text-text-primary"
              onClick={() => setTab(value)}
              onKeyDown={(event) => {
                const offset =
                  event.key === 'ArrowRight'
                    ? 1
                    : event.key === 'ArrowLeft'
                      ? -1
                      : 0;
                if (!offset) return;
                event.preventDefault();
                const next = TABS[(index + offset + TABS.length) % TABS.length];
                if (!next) return;
                setTab(next.id);
                document.getElementById(`${id}-${next.id}-tab`)?.focus();
              }}
            >
              {label}
              {value === 'problem' && stipulation && (
                <span className="max-w-16 truncate rounded bg-accent/15 px-1 font-mono text-[0.6875rem] text-accent normal-case">
                  {stipulation}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === 'pieces' && (
          <Segmented
            label="Rotation, clockwise"
            value={String(rotation) as `${FairyRotation}`}
            options={ROTATION_OPTIONS}
            onChange={(value) =>
              restyle(markerColor, Number(value) as FairyRotation)
            }
            className="font-mono"
          />
        )}
      </div>

      <div
        role="tabpanel"
        id={`${id}-pieces-panel`}
        aria-labelledby={`${id}-pieces-tab`}
        hidden={tab !== 'pieces'}
        className="space-y-3"
      >
        <PiecePalette
          pieceImages={pieceImages}
          groups={groups}
          selectedPiece={selectedPiece}
          onSelect={onSelect}
          onKeyboardPick={onKeyboardPick}
        />
        {error && (
          <p role="alert" className="text-xs text-error">
            {error}. Reload to try again.
          </p>
        )}
        <div className="border-t border-border/50 pt-3">
          <FairyCatalogue
            pieceStyle={pieceStyle}
            rotation={rotation}
            selectedPiece={selectedPiece}
            onSelect={onSelect}
            onKeyboardPick={onKeyboardPick}
          />
        </div>
      </div>
      <div
        role="tabpanel"
        id={`${id}-problem-panel`}
        aria-labelledby={`${id}-problem-tab`}
        hidden={tab !== 'problem'}
      >
        <FairyProblem fen={fen} onChange={onFenChange} />
      </div>
    </div>
  );
});

FairySymbolPalette.displayName = 'FairySymbolPalette';
