import { memo, useCallback, useRef } from 'react';

import { LayoutGrid } from 'lucide-react';

import MiniPreview from '@/components/board/MiniPreview/MiniPreview';
import PieceSelector from '@/components/panels/Fen/PieceSelector/PieceSelector';
import { usePieceImages } from '@hooks';
import { useLocalStorage } from '@hooks';
import { BOARD_THEMES } from '@constants';

import { sanitizeHexColor } from '@utils';
import { SettingsBlock, SettingsHeading } from './parts';
import { useBoardPieceSet } from './useBoardPieceSet';

const PREVIEW_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const DEFAULT_LIGHT = '#f0d9b5';
const DEFAULT_DARK = '#b58863';

const THEME_ENTRIES = Object.entries(BOARD_THEMES);

/**
 * Board section. Surfaces the two board-appearance controls that already drive
 * the board on HomePage, persisted to the SAME storage keys so a change here
 * affects the board everywhere:
 *
 *   - Board square colours → `chess-light-square` / `chess-dark-square`
 *     (the keys `useHomeBoardState` reads, with a cross-tab `storage` event so
 *     an open editor updates immediately). Presets come from `BOARD_THEMES`.
 *   - Piece set → `useBoardPieceSet` (the `chess-piece-style` key the board
 *     reads, plus best-effort E2EE sync).
 *
 * A live `MiniPreview` reflects the current selection.
 */
const BoardSection = memo(function BoardSection() {
  const [lightSquare, setLightSquare] = useLocalStorage<string>(
    'chess-light-square',
    DEFAULT_LIGHT
  );
  const [darkSquare, setDarkSquare] = useLocalStorage<string>(
    'chess-dark-square',
    DEFAULT_DARK
  );
  const [pieceStyle, setPieceStyle] = useBoardPieceSet();
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);

  const themeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const applyPreset = useCallback(
    (light: string, dark: string) => {
      setLightSquare(sanitizeHexColor(light, DEFAULT_LIGHT));
      setDarkSquare(sanitizeHexColor(dark, DEFAULT_DARK));
    },
    [setLightSquare, setDarkSquare]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentKey: string) => {
      const index = THEME_ENTRIES.findIndex(([key]) => key === currentKey);
      if (index < 0) return;
      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = (index + 1) % THEME_ENTRIES.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = (index - 1 + THEME_ENTRIES.length) % THEME_ENTRIES.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = THEME_ENTRIES.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      const next = THEME_ENTRIES[nextIndex];
      if (next) {
        const [key, theme] = next;
        applyPreset(theme.light, theme.dark);
        themeRefs.current.get(key)?.focus();
      }
    },
    [applyPreset]
  );

  return (
    <div className="space-y-8 animate-pageEnter">
      <SettingsHeading
        icon={LayoutGrid}
        title="Board"
        description="Choose how the chess board looks. These settings drive the board and your exported diagrams everywhere, and are saved on this device (and synced, end-to-end encrypted, when signed in)."
      />

      <SettingsBlock
        title="Preview"
        description="A live preview of the current board colours and piece set."
      >
        <div className="w-full max-w-[18rem] overflow-hidden rounded-xl border border-border">
          <MiniPreview
            fen={PREVIEW_FEN}
            lightSquare={lightSquare}
            darkSquare={darkSquare}
            pieceImages={pieceImages}
            piecesLoading={isLoading}
            size={288}
          />
        </div>
      </SettingsBlock>

      <SettingsBlock
        title="Square colours"
        description="Pick a board colour preset. The light and dark squares update across the editor and exports."
      >
        <div
          role="radiogroup"
          aria-label="Board colour preset"
          className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8"
        >
          {THEME_ENTRIES.map(([key, theme]) => {
            const isSelected =
              lightSquare.toLowerCase() === theme.light.toLowerCase() &&
              darkSquare.toLowerCase() === theme.dark.toLowerCase();
            return (
              <button
                key={key}
                ref={(el) => {
                  if (el) themeRefs.current.set(key, el);
                  else themeRefs.current.delete(key);
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={theme.name}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => applyPreset(theme.light, theme.dark)}
                onKeyDown={(e) => handleKeyDown(e, key)}
                className="flex flex-col items-center gap-2 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span
                  className={`flex h-11 w-11 overflow-hidden rounded-full border-2 transition-[border-color,box-shadow] duration-200 ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-border/60 hover:border-text-muted'
                  }`}
                >
                  {/* Preview swatch halves come from the preset DATA via inline
                      backgroundColor — the sanctioned sample-swatch mechanism. */}
                  <span
                    className="h-full w-1/2"
                    style={{ backgroundColor: theme.light }}
                  />
                  <span
                    className="h-full w-1/2"
                    style={{ backgroundColor: theme.dark }}
                  />
                </span>
                <span
                  className={`truncate text-[11px] font-semibold ${
                    isSelected ? 'text-accent' : 'text-text-secondary'
                  }`}
                >
                  {theme.name}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsBlock>

      <SettingsBlock
        title="Piece set"
        description="Choose which set of chess pieces is drawn on the board and in exports."
      >
        <div className="max-w-sm">
          <PieceSelector
            pieceStyle={pieceStyle}
            setPieceStyle={setPieceStyle}
          />
        </div>
      </SettingsBlock>
    </div>
  );
});

BoardSection.displayName = 'BoardSection';
export default BoardSection;
