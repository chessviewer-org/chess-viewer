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

import type { HomeStateForExport } from '@/pages/HomePage/components/ExportStudio.types';
import {
  useDatabaseSearch,
  useEditorKeyboard,
  useInteractiveBoard,
  usePieceImages
} from '@hooks';

import type { ExportConfig } from '@utils';
import { Checkbox } from '@shared/ui';
import CustomDragLayer from '../CustomDragLayer/CustomDragLayer';
import InteractiveBoard from '../InteractiveBoard/InteractiveBoard';
import PiecePalette from '../PiecePalette/PiecePalette';
import TrashZone from '../TrashZone/TrashZone';
import ClipboardHistoryPanel from './ClipboardHistoryPanel';
import CommandBar from './CommandBar';
import DatabaseSearchPanel from './DatabaseSearchPanel';
import { FileCoordinates, RankCoordinates } from './EditorCoordinates';
import ExportSettingsPanel from './ExportSettingsPanel';
import ShareDialog from './ShareDialog';
import { useEditorBoardSize } from './useEditorBoardSize';
import { useShareBoard } from './useShareBoard';

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
  /** Render quality multiplier for the shared board image. Defaults to 2. */
  exportQuality?: number;
  /** Whether the shared image draws the outer coordinate border. */
  showCoordinateBorder?: boolean;
  /** Surfaces share feedback through the host page's notification system. */
  onNotify?: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) => void;
  onPieceImagesChange?: (images: Record<string, HTMLImageElement>) => void;
  /** Which view fills the right-side column. Defaults to 'controls'. */
  activeRightPanel?: 'controls' | 'history' | 'settings';
  /** Load a FEN from history onto the board (does not close the panel). */
  onSelectHistoryFen?: (fen: string) => void;
  /** Open a history FEN in the Advanced FEN editor (navigates away). */
  onSendToAdvanced?: (fen: string) => void;
  /** Switch the right side back to the control tools. */
  onCloseHistory?: () => void;
  /** Toggles the Settings panel (Export Settings). */
  onToggleSettings?: () => void;
  /** The full home state for export studio steps. */
  homeState?: HomeStateForExport;
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
  exportQuality = 2,
  showCoordinateBorder = true,
  onNotify,
  onPieceImagesChange,
  activeRightPanel = 'controls',
  onSelectHistoryFen,
  onSendToAdvanced,
  onCloseHistory,
  onToggleSettings,
  homeState,
  className = ''
}: ChessEditorProps) {
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);
  const { boardSize, gutterSize, containerRef } =
    useEditorBoardSize(showCoords);
  const cellSize = useMemo(() => boardSize / 8, [boardSize]);
  const reduceMotion = useReducedMotion();

  const pieceImagesRef = useRef(pieceImages);
  useEffect(() => {
    pieceImagesRef.current = pieceImages;
  }, [pieceImages]);

  const {
    board,
    handlePieceDrop,
    handlePieceRemove,
    syncFromFen,
    undo,
    redo,
    canUndo,
    canRedo
  } = useInteractiveBoard(fen, onFenChange);

  // Active square for keyboard delete, set by clicking a cell. `null` = none.
  const [selectedSquare, setSelectedSquare] = useState<
    readonly [number, number] | null
  >(null);

  const handleSquareSelect = useCallback((row: number, col: number) => {
    // Toggle off when re-clicking the same square; otherwise move the cursor.
    setSelectedSquare((prev) =>
      prev && prev[0] === row && prev[1] === col ? null : [row, col]
    );
  }, []);

  const handleDeleteSelected = useCallback(() => {
    setSelectedSquare((sel) => {
      if (sel) handlePieceRemove(sel[0], sel[1]);
      return null;
    });
  }, [handlePieceRemove]);

  const clearSelection = useCallback(() => setSelectedSquare(null), []);

  useEffect(() => {
    syncFromFen(fen);
  }, [fen, syncFromFen]);

  // Drop any stale selection when the position is replaced from outside (FEN
  // input, history load) so the highlight never points at a moved/removed piece.
  useEffect(() => {
    setSelectedSquare(null);
  }, [fen]);

  const keyboardActions = useMemo(
    () => ({
      onFlip,
      onUndo: undo,
      onRedo: redo,
      onDelete: handleDeleteSelected,
      onEscape: clearSelection
    }),
    [onFlip, undo, redo, handleDeleteSelected, clearSelection]
  );

  // Editor-wide shortcuts: F flip · Ctrl/Cmd+Z undo · Ctrl/Cmd+Y (or +Shift+Z)
  // redo · Delete/Backspace remove selected piece · Esc clear · Arrow/Page/Home/
  // End scroll the page. Suppressed while typing in a field or inside a dialog.
  useEditorKeyboard(keyboardActions);

  useEffect(() => {
    onPieceImagesChange?.(pieceImages);
  }, [pieceImages, onPieceImagesChange]);

  const handleTrashDrop = useCallback(
    (row: number, col: number) => {
      handlePieceRemove(row, col);
    },
    [handlePieceRemove]
  );

  // Manual, per-provider database lookup (Lichess / ChessDB / PDB / YACPDB).
  // Nothing fires on FEN change — the user triggers each row's search from the
  // DatabaseSearchPanel.
  const {
    lichess: lichessState,
    chessdb: chessdbState,
    pdb: pdbState,
    yacpdb: yacpdbState
  } = useDatabaseSearch(fen);

  const handleCopyFen = useCallback(() => {
    void navigator.clipboard.writeText(fen);
  }, [fen]);

  const [isShareOpen, setIsShareOpen] = useState(false);

  // Built lazily at share time so the rendered image reflects the latest
  // board state, piece set, theme, and display toggles.
  const buildExportConfig = useCallback(
    (): ExportConfig => ({
      boardSize,
      showCoords,
      exportQuality,
      showThinFrame,
      fen,
      lightSquare,
      darkSquare,
      pieceImages: pieceImagesRef.current,
      flipped,
      showCoordinateBorder
    }),
    [
      boardSize,
      showCoords,
      exportQuality,
      showThinFrame,
      fen,
      lightSquare,
      darkSquare,
      flipped,
      showCoordinateBorder
    ]
  );

  const { targets, openTarget, copyLink, shareImage, isBusy } = useShareBoard({
    fen,
    buildExportConfig,
    ...(onNotify ? { onNotify } : {})
  });

  const handleShare = useCallback(() => setIsShareOpen(true), []);
  const closeShare = useCallback(() => setIsShareOpen(false), []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-fluid-md w-full min-w-0 overflow-x-hidden ${className}`}
    >
      <CustomDragLayer pieceImages={pieceImages} boardSize={boardSize} />

      {/* Board (left, fixed px) + command-center panel (right, flex-1). The
          single→two-column switch is a CONTAINER query (`@5xl`, ~1024px of the
          workspace card), not a viewport breakpoint, so the columns split based
          on the card's real width — they stay side-by-side on ultra-wide and
          never collapse into each other. `items-stretch` so the panel matches
          the board column height.

          On ultra-wide the pair fills the FULL card width (which equals the
          navbar width), so the right edge of the panel lines up with the navbar
          / account menu — no width cap, no centering. The board keeps its px
          width on the left; the panel (`flex-1`) takes the rest. */}
      <div className="flex flex-col @5xl:flex-row gap-fluid-sm items-center @5xl:items-stretch w-full min-h-0">
        <div className="shrink-0 flex justify-center w-full @5xl:w-auto max-w-full min-w-0">
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
                // "Show Board Frame" draws a thin frame around the live board,
                // mirroring the thin outer frame the export pipeline adds
                // (svgExporter/canvasRenderer) so the toggle has an immediate,
                // visible effect in the editor — not only in the exported file.
                // Per chess-diagram convention the frame takes the board's dark
                // square colour (not the app accent) so it reads as part of the
                // board rather than a UI highlight.
                className={
                  showThinFrame ? 'box-border border-2 rounded-sm' : undefined
                }
                style={{
                  width: boardSize,
                  height: boardSize,
                  flexShrink: 0,
                  maxWidth: '100%',
                  position: 'relative',
                  ...(showThinFrame ? { borderColor: darkSquare } : {})
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
                  onSquareSelect={handleSquareSelect}
                  selectedSquare={selectedSquare}
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

        {/* Right column is pinned to the BOARD's exact pixel height in the
            two-column (container `@5xl`) state via --board-h, so the controls'
            bottom action bar aligns with the bottom of the board itself — NOT
            the coordinate row beneath it. --board-h is the live board PIXEL size
            (DnD/canvas coordinate math); only the column CHROME around it is
            fluid. The persistent toolbar sits at the top; the swappable area
            (flex-1) fills the rest. Stacked single-column → height is auto. */}
        <div
          className="flex flex-col gap-fluid-xs flex-1 w-full @5xl:w-auto min-w-0 @5xl:h-[var(--board-h)]"
          style={{ '--board-h': `${boardSize}px` } as CSSProperties}
        >
          {/* PERSISTENT action toolbar — Settings (far left) · Command Bar
              (Copy / Share / Export · DB icons, far right). Always anchored at
              the top; only the content BELOW it swaps between tools/history/settings. */}
          <div className="shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="relative">
                <button
                  type="button"
                  onClick={onToggleSettings}
                  className={`p-1.5 coarse:min-h-11 coarse:min-w-11 flex items-center justify-center rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    activeRightPanel === 'settings'
                      ? 'text-accent bg-accent/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                  title="Board Settings"
                  aria-label="Open Board Settings"
                  aria-pressed={activeRightPanel === 'settings'}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <CommandBar
                onCopyFen={handleCopyFen}
                onShare={handleShare}
                onDownload={onDownload}
              />
            </div>
            {/* Separator below the toolbar header (high-contrast). */}
            <div className="h-px bg-white/15 mt-2" />
          </div>

          {/* Swappable content area below the persistent toolbar. Slide+fade
              transition between views (mode="wait" so one leaves before the
              next enters). flex-1 fills the pinned height. */}
          <AnimatePresence mode="wait" initial={false}>
            {activeRightPanel === 'settings' && homeState ? (
              <motion.div
                key="settings"
                className="flex-1 min-h-0 overflow-y-auto"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <ExportSettingsPanel homeState={homeState} />
              </motion.div>
            ) : activeRightPanel === 'history' ? (
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
                className="flex flex-col gap-2.5 flex-1 min-h-0"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <>
                  {/* Top cluster: palette + option cards + DB search. flex-1 so
              this cluster absorbs the full space between the toolbar and the
              bottom action bar — no dead gap on tall desktop boards. min-h-0 so
              an over-tall cluster scrolls rather than pushing past the pinned
              board height. */}
                  <div className="flex flex-col gap-fluid-xs flex-1 min-h-0 overscroll-trap">
                    {/* Piece palette — single row (White · divider · Black). */}
                    <div className="w-full shrink-0 overflow-hidden rounded-xl border border-border/40 bg-surface-elevated px-2.5 py-2">
                      <PiecePalette
                        pieceImages={pieceImages}
                        isLoading={isLoading}
                      />
                    </div>

                    {/* Display Options — bare on the background (no card), label + free
              checkboxes. */}
                    <div className="w-full shrink-0 px-1">
                      <span className="block text-fluid-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
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

                    {/* Database Search — dedicated manual-search panel. flex-1 so
                it grows to fill the remaining column height (the palette and
                options keep their natural height); its 2×2 grid stretches with
                it, enlarging the provider cells and filling the previously
                empty middle of the editor. */}
                    <DatabaseSearchPanel
                      lichess={lichessState}
                      chessdb={chessdbState}
                      pdb={pdbState}
                      yacpdb={yacpdbState}
                      className="flex-1 min-h-0"
                    />
                  </div>

                  {/* Bottom action bar: Undo/Redo/Flip grouped left; Trash zone right
              (expands on hover). shrink-0 keeps it at natural height while the
              cluster above grows to pin this row to the board's bottom edge.
              (Clear/Reset now live in the FEN toolbar.) */}
                  <div className="flex flex-row items-center gap-2 w-full shrink-0">
                    <div className="flex flex-row items-center gap-1.5 shrink-0">
                      {/* Undo / Redo — backed by the board history stack. */}
                      <button
                        type="button"
                        onClick={undo}
                        disabled={!canUndo}
                        className="flex items-center justify-center px-2.5 py-2 min-h-10 coarse:min-w-11 rounded-lg border border-border bg-surface-elevated text-text-secondary transition duration-200 ease-out shadow-sm enabled:hover:bg-surface-hover enabled:hover:border-border enabled:hover:text-text-primary enabled:active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                        title="Undo (Ctrl+Z)"
                        aria-label="Undo last change"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={redo}
                        disabled={!canRedo}
                        className="flex items-center justify-center px-2.5 py-2 min-h-10 coarse:min-w-11 rounded-lg border border-border bg-surface-elevated text-text-secondary transition duration-200 ease-out shadow-sm enabled:hover:bg-surface-hover enabled:hover:border-border enabled:hover:text-text-primary enabled:active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                        title="Redo (Ctrl+Y)"
                        aria-label="Redo last change"
                      >
                        <Redo2 className="w-4 h-4" />
                      </button>
                      {/* Flip moved here from the top toolbar header. */}
                      <button
                        type="button"
                        onClick={onFlip}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-10 text-sm font-semibold text-text-secondary bg-surface-elevated hover:bg-surface-hover border border-border hover:border-border hover:text-text-primary rounded-lg transition duration-200 ease-out shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]"
                        title="Flip board (F)"
                        aria-label="Flip board orientation"
                      >
                        <Repeat2 className="w-4 h-4" />
                        <span className="hidden xs:inline">Flip</span>
                      </button>
                    </div>

                    {/* Trash zone — sized to show its full label, and grows a
                        little further to the LEFT while a board piece is being
                        dragged over it (handled inside TrashZone via flex-grow
                        on the active state). */}
                    <div className="ml-auto h-10 min-h-10 flex-1 max-w-52 shrink">
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

      <ShareDialog
        isOpen={isShareOpen}
        onClose={closeShare}
        fen={fen}
        targets={targets}
        onOpenTarget={openTarget}
        onCopyLink={() => void copyLink()}
        onShareImage={() => void shareImage()}
        isBusy={isBusy}
      />
    </div>
  );
});

ChessEditor.displayName = 'ChessEditor';

export default ChessEditor;
