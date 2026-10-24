import { memo, useId } from 'react';
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
import { getPieceKey } from '@/shared/utils/pieceUtils';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { usePieceImages } from '@/shared/hooks/usePieceImages';
import { FairyCatalogue } from '../FairySetup/FairyCatalogue';
import { Segmented } from '../FairySetup/Segmented';
import { PiecePalette, type PaletteGroup } from './PiecePalette';
import styles from '../FairySetup/styles/fairy-catalogue.module.scss';

interface FairySymbolPaletteProps {
  pieceStyle: string;
  selectedPiece: BoardCell | null;
  onSelect: (piece: BoardCell) => void;
  onKeyboardPick: (piece: BoardCell) => void;
}

const PIECES: readonly FairyPieceType[] = ['K', 'Q', 'R', 'B', 'N', 'P'];
const MARKERS: readonly FairyPieceType[] = ['C', 'X', 'S', 'T'];
const COLORS: readonly { color: FairyColor; label: string }[] = [
  { color: 'w', label: 'White' },
  { color: 'b', label: 'Black' },
  { color: 'n', label: 'Neutral' }
];
const COLOR_OPTIONS = COLORS.map(({ color, label }) => ({
  value: color,
  label
}));
const TABS = [
  { id: 'symbols', label: 'Symbols' },
  { id: 'named', label: 'Named pieces' }
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

const asColor = (value: unknown): FairyColor =>
  value === 'b' || value === 'n' ? value : 'w';

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
  pieceStyle,
  selectedPiece,
  onSelect,
  onKeyboardPick
}: FairySymbolPaletteProps) {
  const id = useId();
  const [storedTab, setTab] = useLocalStorage<string>(
    'fairy-palette-tab',
    'symbols'
  );
  const [storedRotation, setRotation] = useLocalStorage<number>(
    'fairy-palette-rotation',
    0
  );
  const [storedMarkerColor, setMarkerColor] = useLocalStorage<string>(
    'fairy-marker-color',
    'w'
  );
  const [storedNamedColor, setNamedColor] = useLocalStorage<string>(
    'fairy-named-color',
    'w'
  );
  const tab: PaletteTab = storedTab === 'named' ? 'named' : 'symbols';
  const rotation =
    FAIRY_ROTATIONS.find((value) => value === storedRotation) ?? 0;
  const markerColor = asColor(storedMarkerColor);
  const namedColor = asColor(storedNamedColor);
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
    <div
      className={tab === 'named' ? styles.named : 'min-w-0'}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={tab === 'named' ? styles.namedLayout : undefined}>
        <div
          className={
            tab === 'named'
              ? 'contents'
              : 'mb-2 flex flex-wrap items-center justify-between gap-2'
          }
        >
          <div
            role="tablist"
            aria-label="Fairy pieces"
            className={`flex gap-4 ${tab === 'named' ? styles.tabs : ''}`}
          >
            {TABS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`${id}-${item.id}-tab`}
                aria-controls={`${id}-${item.id}-panel`}
                aria-selected={tab === item.id}
                tabIndex={tab === item.id ? 0 : -1}
                className="flex h-8 cursor-pointer items-center gap-1.5 border-b-2 border-transparent text-xs font-semibold tracking-[0.075em] text-text-secondary uppercase hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-selected:border-accent aria-selected:text-text-primary"
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')
                    return;
                  event.preventDefault();
                  const next = TABS[(index + 1) % TABS.length];
                  if (!next) return;
                  setTab(next.id);
                  document.getElementById(`${id}-${next.id}-tab`)?.focus();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          {tab === 'symbols' ? (
            <Segmented
              label="Rotation, clockwise"
              value={String(rotation) as `${FairyRotation}`}
              options={ROTATION_OPTIONS}
              onChange={(value) =>
                restyle(markerColor, Number(value) as FairyRotation)
              }
              className="ml-auto font-mono"
            />
          ) : (
            <Segmented
              label="Named piece colour"
              value={namedColor}
              options={COLOR_OPTIONS}
              onChange={setNamedColor}
              className={styles.colour}
            />
          )}
        </div>
        <div
          role="tabpanel"
          id={`${id}-symbols-panel`}
          aria-labelledby={`${id}-symbols-tab`}
          hidden={tab !== 'symbols'}
        >
          <PiecePalette
            adaptive
            pieceImages={pieceImages}
            groups={groups}
            selectedPiece={selectedPiece}
            onSelect={onSelect}
            onKeyboardPick={onKeyboardPick}
          />
          {error && (
            <p role="alert" className="mt-2 text-xs text-error">
              {error}. Reload to try again.
            </p>
          )}
        </div>
        <div
          role="tabpanel"
          id={`${id}-named-panel`}
          aria-labelledby={`${id}-named-tab`}
          hidden={tab !== 'named'}
          className={tab === 'named' ? 'contents' : undefined}
        >
          <FairyCatalogue
            color={namedColor}
            selectedPiece={selectedPiece}
            onSelect={onSelect}
            onKeyboardPick={onKeyboardPick}
          />
        </div>
      </div>
    </div>
  );
});

FairySymbolPalette.displayName = 'FairySymbolPalette';
