import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { LayoutGrid } from 'lucide-react';

import MiniPreview from '@/components/board/MiniPreview/MiniPreview';
import { usePieceImages } from '@hooks';
import { useLocalStorage } from '@hooks';
import { PIECE_SETS } from '@constants';

import { sanitizeHexColor } from '@utils';
import BoardThemePicker from './board/BoardThemePicker';
import { SettingsBlock, SettingsHeading } from './parts';
import { useBoardPieceSet } from './useBoardPieceSet';

const PREVIEW_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const DEFAULT_LIGHT = '#f0d9b5';
const DEFAULT_DARK = '#b58863';

/** Delay (ms) before a live colour drag is written to storage + synced. */
const PERSIST_DEBOUNCE_MS = 350;

/**
 * Board Style section. Two board-appearance controls that drive the board on
 * HomePage and exports, persisted to the SAME storage keys so a change here
 * applies everywhere: square colours (`chess-light-square` /
 * `chess-dark-square`) and the piece set (`useBoardPieceSet`). A live
 * `MiniPreview` reflects the current selection.
 *
 * Colour changes update an instant local state (so the preview and grid feel
 * live during a colour drag) but the write to localStorage — which fires the
 * cross-tab `storage` event the HomePage editor and FEN history listen to — is
 * DEBOUNCED. That keeps a continuous drag from hammering storage / re-syncing
 * every frame; persistence lands once the user settles on a colour.
 */
const BoardSection = memo(function BoardSection() {
  const [storedLight, setStoredLight] = useLocalStorage<string>(
    'chess-light-square',
    DEFAULT_LIGHT
  );
  const [storedDark, setStoredDark] = useLocalStorage<string>(
    'chess-dark-square',
    DEFAULT_DARK
  );

  // Instant, render-only mirror of the colours for a smooth live drag.
  const [lightSquare, setLightSquare] = useState(storedLight);
  const [darkSquare, setDarkSquare] = useState(storedDark);

  // Keep the local mirror in step with external changes (cross-tab edits, other
  // surfaces writing the same keys) only when not mid-edit here.
  useEffect(() => setLightSquare(storedLight), [storedLight]);
  useEffect(() => setDarkSquare(storedDark), [storedDark]);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    },
    []
  );

  const [pieceStyle, setPieceStyle] = useBoardPieceSet();
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);

  const applyPreset = useCallback(
    (light: string, dark: string) => {
      const safeLight = sanitizeHexColor(light, DEFAULT_LIGHT);
      const safeDark = sanitizeHexColor(dark, DEFAULT_DARK);
      // Instant UI.
      setLightSquare(safeLight);
      setDarkSquare(safeDark);
      // Debounced persistence (storage write + cross-tab sync).
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        setStoredLight(safeLight);
        setStoredDark(safeDark);
      }, PERSIST_DEBOUNCE_MS);
    },
    [setStoredLight, setStoredDark]
  );

  return (
    <div className="space-y-6 animate-pageEnter">
      <SettingsHeading
        icon={LayoutGrid}
        title="Board Style"
        description="Colours and pieces for the board and your exports. Saved on this device, and synced (end-to-end encrypted) when signed in."
      />

      <SettingsBlock title="Square colours">
        {/* Desktop: live board preview LEFT, theme controls RIGHT — both share
            the same height so the picker column always matches the board.
            Stacks on narrow screens. Preview has square corners. */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6">
          <div className="w-full max-w-[24rem] shrink-0 overflow-hidden border border-border lg:w-96">
            <MiniPreview
              fen={PREVIEW_FEN}
              lightSquare={lightSquare}
              darkSquare={darkSquare}
              pieceImages={pieceImages}
              piecesLoading={isLoading}
              size={384}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <BoardThemePicker
              lightSquare={lightSquare}
              darkSquare={darkSquare}
              onApply={applyPreset}
            />
          </div>
        </div>
      </SettingsBlock>

      <SettingsBlock title="Piece set">
        <PieceGrid pieceStyle={pieceStyle} onSelect={setPieceStyle} />
      </SettingsBlock>
    </div>
  );
});

BoardSection.displayName = 'BoardSection';
export default BoardSection;

/**
 * Visual piece-set picker: a responsive grid of knight (wN) previews, one per
 * available set, rendered straight from Lichess's piece CDN (allow-listed in the
 * CSP `img-src`). The selected set carries an accent ring. Clicking a cell drives
 * `useBoardPieceSet`, so the choice applies to the board and exports everywhere.
 */
function PieceGrid({
  pieceStyle,
  onSelect
}: {
  pieceStyle: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {PIECE_SETS.map((set) => (
        <button
          key={set.id}
          type="button"
          onClick={() => onSelect(set.id)}
          aria-pressed={pieceStyle === set.id}
          aria-label={set.name}
          className={`flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            pieceStyle === set.id
              ? 'border-accent bg-accent/10'
              : 'border-transparent hover:border-border hover:bg-surface-elevated'
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
    </div>
  );
}
