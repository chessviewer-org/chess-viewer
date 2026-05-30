import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Redo2, Repeat2, Settings, Undo2 } from 'lucide-react';

import {
  useDatabaseSearch,
  useInteractiveBoard,
  usePieceImages,
  useTheme
} from '@hooks';

import { Checkbox } from '@shared/ui';
import CustomDragLayer from '../CustomDragLayer/CustomDragLayer';
import InteractiveBoard from '../InteractiveBoard/InteractiveBoard';
import PiecePalette from '../PiecePalette/PiecePalette';
import TrashZone from '../TrashZone/TrashZone';
import ClipboardHistoryPanel from './ClipboardHistoryPanel';
import CommandBar from './CommandBar';
import DatabaseSearchPanel from './DatabaseSearchPanel';
import { FileCoordinates, RankCoordinates } from './EditorCoordinates';
import QuickThemePopover from './QuickThemePopover';
import { useEditorBoardSize } from './useEditorBoardSize';

/** Props for the `ChessEditor` interactive board wrapper. */
export interface ChessEditorProps {
  fen: string;
  onFenChange: (fen: string) => void;
  pieceStyle: string;
  showCoords: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  onFlip?: () => void;
  onDownload?: () => void;
  setShowCoords?: (show: boolean) => void;
  showThinFrame?: boolean;
  setShowThinFrame?: (show: boolean) => void;
  onPieceImagesChange?: (images: Record<string, HTMLImageElement>) => void;
  /** Which view fills the right-side column. Defaults to 'controls'. */
  activeRightPanel?: 'controls' | 'history';
  /** Load a FEN from history onto the board (does not close the panel). */
  onSelectHistoryFen?: (fen: string) => void;
  /** Open a history FEN in the Advanced FEN editor (navigates away). */
  onSendToAdvanced?: (fen: string) => void;
  /** Switch the right side back to the control tools. */
  onCloseHistory?: () => void;
  className?: string;
}

export const ChessEditor = memo(function ChessEditor({
  fen,
  onFenChange,
  pieceStyle,
  showCoords,
  lightSquare,
  darkSquare,
  flipped,
  onFlip,
  onDownload,
  setShowCoords,
  showThinFrame = false,
  setShowThinFrame,
  onPieceImagesChange,
  activeRightPanel = 'controls',
  onSelectHistoryFen,
  onSendToAdvanced,
  onCloseHistory,
  className = ''
}: ChessEditorProps) {
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);
  const { boardSize, gutterSize, containerRef } =
    useEditorBoardSize(showCoords);
  const cellSize = useMemo(() => boardSize / 8, [boardSize]);
  const reduceMotion = useReducedMotion();

  const [isQuickThemeOpen, setIsQuickThemeOpen] = useState(false);
  const themeAnchorRef = useRef<HTMLDivElement>(null);
  const { applyCustomTheme } = useTheme();

  const handleApplyQuickTheme = useCallback(
    (light: string, dark: string) => {
      applyCustomTheme(light, dark);
      setIsQuickThemeOpen(false);
    },
    [applyCustomTheme]
  );

  const closeQuickTheme = useCallback(() => setIsQuickThemeOpen(false), []);

  const pieceImagesRef = useRef(pieceImages);
  useEffect(() => {
    pieceImagesRef.current = pieceImages;
  }, [pieceImages]);

  const { board, handlePieceDrop, handlePieceRemove, syncFromFen } =
    useInteractiveBoard(fen, onFenChange);

  useEffect(() => {
    syncFromFen(fen);
  }, [fen, syncFromFen]);

  useEffect(() => {
    onPieceImagesChange?.(pieceImages);
  }, [pieceImages, onPieceImagesChange]);

  const handleTrashDrop = useCallback(
    (row: number, col: number) => {
      handlePieceRemove(row, col);
    },
    [handlePieceRemove]
  );

  // Manual, per-provider database lookup (PDB / YACPDB). Nothing fires on FEN
  // change — the user triggers each row's search from the DatabaseSearchPanel.
  const { pdb: pdbState, yacpdb: yacpdbState } = useDatabaseSearch(fen);

  const handleCopyFen = useCallback(() => {
    void navigator.clipboard.writeText(fen);
  }, [fen]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-4 sm:gap-6 w-full min-w-0 overflow-x-hidden ${className}`}
    >
      <CustomDragLayer pieceImages={pieceImages} boardSize={boardSize} />

      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-center lg:items-stretch w-full min-h-0">
        <div className="shrink-0 flex justify-center w-full lg:w-auto max-w-full min-w-0">
          <div
            className="relative flex flex-col items-center justify-start min-w-0"
            style={{
              width: showCoords ? boardSize + gutterSize : boardSize,
              maxWidth: '100%'
            }}
          >
            <div className="flex max-w-full">
              {showCoords && (
                <RankCoordinates
                  flipped={flipped}
                  cellSize={cellSize}
                  gutterSize={gutterSize}
                />
              )}
              <div
                style={{
                  width: boardSize,
                  height: boardSize,
                  flexShrink: 0,
                  maxWidth: '100%',
                  position: 'relative'
                }}
              >
                <InteractiveBoard
                  board={board}
                  lightSquare={lightSquare}
                  darkSquare={darkSquare}
                  pieceImages={pieceImages}
                  isLoading={isLoading}
                  flipped={flipped}
                  onPieceDrop={handlePieceDrop}
                />
              </div>
            </div>

            {showCoords && (
              <FileCoordinates
                flipped={flipped}
                cellSize={cellSize}
                gutterSize={gutterSize}
              />
            )}

            {isLoading && (
              <div
                className="absolute flex flex-col items-center justify-center bg-surface z-30"
                style={{
                  top: 0,
                  left: showCoords ? gutterSize : 0,
                  width: boardSize,
                  height: boardSize
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-4 border-border"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
                  </div>
                  <div className="text-text-primary text-sm font-semibold animate-pulse text-center px-4 break-words">
                    Loading pieces...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column is pinned to the BOARD's exact pixel height on lg+
            (via --board-h), so the controls' bottom action bar aligns with the
            bottom of the board itself — NOT the coordinate row beneath it. The
            persistent toolbar sits at the top; the swappable area (flex-1)
            fills the rest. On small screens it stacks and height is auto. */}
        <div
          className="flex flex-col gap-2.5 flex-1 w-full lg:w-auto min-w-0 lg:h-[var(--board-h)]"
          style={{ '--board-h': `${boardSize}px` } as CSSProperties}
        >
          {/* PERSISTENT action toolbar — Settings (far left) · Command Bar
              (Copy / Share / Export · DB icons, far right). Always anchored at
              the top; only the content BELOW it swaps between tools/history. */}
          <div className="shrink-0">
            <div className="flex items-center justify-between w-full">
              <div ref={themeAnchorRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsQuickThemeOpen((prev) => !prev)}
                  className={`p-1.5 rounded-lg transition-colors duration-200 ${isQuickThemeOpen ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}`}
                  title="Quick Theme"
                  aria-label="Open Quick Theme picker"
                  aria-haspopup="dialog"
                  aria-expanded={isQuickThemeOpen}
                >
                  <Settings className="w-5 h-5" />
                </button>
                <QuickThemePopover
                  open={isQuickThemeOpen}
                  currentLight={lightSquare}
                  currentDark={darkSquare}
                  onApply={handleApplyQuickTheme}
                  onClose={closeQuickTheme}
                  anchorRef={themeAnchorRef}
                />
              </div>

              <CommandBar onCopyFen={handleCopyFen} onDownload={onDownload} />
            </div>
            {/* Separator below the toolbar header (high-contrast). */}
            <div className="h-px bg-white/15 mt-2" />
          </div>

          {/* Swappable content area below the persistent toolbar. Slide+fade
              transition between the two views (mode="wait" so one leaves before
              the next enters). flex-1 fills the pinned height. */}
          <AnimatePresence mode="wait" initial={false}>
            {activeRightPanel === 'history' ? (
              <motion.div
                key="history"
                className="flex-1 min-h-0"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {/* Inline Clipboard History — no modal/backdrop. Selecting an
                    entry previews it on the board (left) without leaving. */}
                <ClipboardHistoryPanel
                  isActive
                  currentFen={fen}
                  onSelectFen={(f) => onSelectHistoryFen?.(f)}
                  onSendToAdvanced={(f) => onSendToAdvanced?.(f)}
                  onBack={() => onCloseHistory?.()}
                />
              </motion.div>
            ) : (
              <motion.div
                key="controls"
                className="flex flex-col justify-between gap-2.5 flex-1 min-h-0"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <>
          {/* Top cluster: palette + option cards. Roomier vertical rhythm
              (gap-4) between functional sections. min-h-0 + overflow-y-auto so a
              tall cluster can never push past the pinned board height. */}
          <div className="flex flex-col gap-4 min-h-0 overflow-y-auto">
          {/* Piece palette — single row (White · divider · Black). */}
          <div className="w-full overflow-hidden rounded-xl border border-border/40 bg-surface-elevated px-2.5 py-2">
            <PiecePalette pieceImages={pieceImages} isLoading={isLoading} />
          </div>

          {/* Display Options — bare on the background (no card), label + free
              checkboxes. */}
          <div className="w-full px-1">
            <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1">
              Display Options
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Checkbox
                checked={showCoords}
                onChange={(e) => setShowCoords?.(e.target.checked)}
                label="Show Coordinates"
                className="!p-1"
              />
              <Checkbox
                checked={showThinFrame}
                onChange={(e) => setShowThinFrame?.(e.target.checked)}
                label="Show Board Frame"
                className="!p-1"
              />
            </div>
          </div>

          {/* Database Search — dedicated manual-search panel. */}
          <DatabaseSearchPanel pdb={pdbState} yacpdb={yacpdbState} />
          </div>

          {/* Bottom action bar: Undo/Redo/Flip grouped left; Trash zone right
              (expands on hover). justify-between on the column pins this row to
              the board's bottom edge. (Clear/Reset now live in the FEN toolbar.) */}
          <div className="flex flex-row items-center gap-2 w-full">
            <div className="flex flex-row items-center gap-1.5 shrink-0">
              {/* Undo / Redo — placeholders (no history logic yet). */}
              <button
                type="button"
                disabled
                className="flex items-center justify-center px-2.5 py-2 min-h-10 rounded-lg border border-border bg-surface-elevated text-text-secondary opacity-50 cursor-not-allowed"
                title="Undo (coming soon)"
                aria-label="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled
                className="flex items-center justify-center px-2.5 py-2 min-h-10 rounded-lg border border-border bg-surface-elevated text-text-secondary opacity-50 cursor-not-allowed"
                title="Redo (coming soon)"
                aria-label="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              {/* Flip moved here from the top toolbar header. */}
              <button
                type="button"
                onClick={onFlip}
                className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-10 text-sm font-semibold text-text-secondary bg-surface-elevated hover:bg-surface-hover border border-border hover:border-accent/40 hover:text-accent rounded-lg transition duration-200 ease-out shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]"
                title="Flip board"
                aria-label="Flip board orientation"
              >
                <Repeat2 className="w-4 h-4" />
                <span>Flip</span>
              </button>
            </div>

            {/* Spacious trash zone — wide fixed width, expands further on hover. */}
            <div className="ml-auto h-10 min-h-10 w-44 hover:w-56 transition-[width] duration-300 ease-out">
              <TrashZone
                onDrop={handleTrashDrop}
                className="h-full w-full rounded-lg"
              />
            </div>
          </div>
                </>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

ChessEditor.displayName = 'ChessEditor';

export default ChessEditor;
