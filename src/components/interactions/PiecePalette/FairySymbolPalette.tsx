import { memo, useId } from 'react';
import { ArrowLeft, ArrowUp } from '@/assets/icons';
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
import palette from './styles/fairy-palette.module.scss';

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
const ROTATION_LABELS: Record<FairyRotation, string> = {
  0: 'Up, upright (0°)',
  90: 'Right, clockwise (90°)',
  180: 'Down, upside down (180°)',
  270: 'Left, clockwise (270°)'
};
const ROTATION_OPTIONS = FAIRY_ROTATIONS.map((value) => ({
  value: String(value) as `${FairyRotation}`,
  label: <ArrowUp className={styles.orientationArrow} data-rotation={value} />,
  title: ROTATION_LABELS[value],
  ariaLabel: ROTATION_LABELS[value]
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
  w: palette.dotWhite,
  b: palette.dotBlack,
  n: palette.dotNeutral
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
          <span className={palette.markerArrow} aria-hidden="true">
            <ArrowLeft className={palette.markerArrowIcon} />
          </span>
          <div
            role="group"
            aria-label="Marker colour"
            className={palette.markerColors}
          >
            {COLORS.map(({ color, label }) => (
              <button
                key={color}
                type="button"
                title={`${label} markers`}
                aria-label={`${label} markers`}
                aria-pressed={markerColor === color}
                onClick={() => restyle(color, rotation)}
                className={palette.markerDot}
              >
                <span className={`${palette.dot} ${DOTS[color]}`} />
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
      className={tab === 'named' ? styles.named : palette.root}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={tab === 'named' ? styles.namedLayout : undefined}>
        <div className={tab === 'named' ? palette.contents : palette.header}>
          <div
            role="tablist"
            aria-label="Fairy pieces"
            className={`${palette.tablist} ${tab === 'named' ? styles.tabs : ''}`}
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
                className={palette.tab}
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
              className={styles.orientation}
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
            pairedGroups
            pieceImages={pieceImages}
            groups={groups}
            selectedPiece={selectedPiece}
            onSelect={onSelect}
            onKeyboardPick={onKeyboardPick}
          />
          {error && (
            <p role="alert" className={palette.error}>
              {error}. Reload to try again.
            </p>
          )}
        </div>
        <div
          role="tabpanel"
          id={`${id}-named-panel`}
          aria-labelledby={`${id}-named-tab`}
          hidden={tab !== 'named'}
          className={tab === 'named' ? palette.contents : undefined}
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
