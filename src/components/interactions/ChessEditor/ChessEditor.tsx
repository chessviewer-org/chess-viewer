import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Redo2, Repeat2, Undo2 } from 'lucide-react';

import {
  useDatabaseSearch,
  useEditorKeyboard,
  useEffectiveReducedMotion,
  useInteractiveBoard,
  usePieceImages
} from '@hooks';
import type { PieceSymbol } from '@app-types/chess';

import type { ExportConfig } from '@utils';
import { Checkbox } from '@shared/ui';
import CustomDragLayer from '../CustomDragLayer/CustomDragLayer';
import type { BoardKeyboardApi } from '../InteractiveBoard/InteractiveBoard';
import InteractiveBoard from '../InteractiveBoard/InteractiveBoard';
import PiecePalette from '../PiecePalette/PiecePalette';
import TrashZone from '../TrashZone/TrashZone';
import ClipboardHistoryPanel from './ClipboardHistoryPanel';
import CommandBar from './CommandBar';
import DatabaseSearchPanel from './DatabaseSearchPanel';
import { FileCoordinates, RankCoordinates } from './EditorCoordinates';
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
  exportQuality = 2,
  showCoordinateBorder = true,
  onNotify,
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
  const reduceMotion = useEffectiveReducedMotion();

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

  // Board's imperative keyboard API (set once from InteractiveBoard). Lets a
  // palette piece chosen by keyboard be carried on the board's roving cursor.
  const boardKeyboardApiRef = useRef<BoardKeyboardApi | null>(null);
  const handleKeyboardApi = useCallback((api: BoardKeyboardApi) => {
    boardKeyboardApiRef.current = api;
  }, []);
  const handlePalettePick = useCallback((piece: PieceSymbol) => {
    boardKeyboardApiRef.current?.pickUpFromPalette(piece);
  }, []);

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

  const { payload, targets, openTarget, copyLink, shareImage, isBusy } =
    useShareBoard({
      fen,
      buildExportConfig,
      ...(onNotify ? { onNotify } : {})
    });

  const handleShare = useCallback(() => setIsShareOpen(true), []);
  const closeShare = useCallback(() => setIsShareOpen(false), []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col gap-fluid-sm w-full min-w-0 overflow-x-hidden ${className}`}
    >
      <CustomDragLayer pieceImages={pieceImages} boardSize={boardSize} />

      {/* Board (left, fixed px) + command-center panel (right, flex-1). The
          single→two-column switch is a CONTAINER query (`@3xl`, ~768px of the
          workspace card), not a viewport breakpoint, so the columns split based
          on the card's real width — they stay side-by-side on ultra-wide and
          never collapse into each other. `items-stretch` so the panel matches
          the board column height.

          On ultra-wide the pair fills the FULL card width (which equals the
          navbar width), so the right edge of the panel lines up with the navbar
          / account menu — no width cap, no centering. The board keeps its px
          width on the left; the panel (`flex-1`) takes the rest. */}
      <div className="flex flex-col @3xl:flex-row gap-fluid-sm items-center @3xl:items-stretch w-full min-h-0">
        <div className="shrink-0 flex justify-center w-full @3xl:w-auto max-w-full min-w-0">
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
                  onPieceRemove={handlePieceRemove}
                  onKeyboardApi={handleKeyboardApi}
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
                  <div className="text-text-primary text-sm font-semibold animate-pulse text-center px-4 wrap-break-word">
                    Loading pieces...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column height matches the board's total column height (board
            + optional coordinates) so the top toolbar and bottom action bar
            align exactly with the left side's edges. Only the middle tools area
            is fluid and grows to fill the pinned height. Stacked single-column
            height remains auto. */}
        <div
          className="flex flex-col gap-fluid-xs flex-1 w-full @3xl:w-auto min-w-0 @3xl:h-(--board-h)"
          style={
            {
              '--board-h': `${boardSize + (showCoords ? gutterSize : 0)}px`
            } as CSSProperties
          }
        >
          {/* PERSISTENT action toolbar — Command Bar (Copy / Share / Export ·
              DB icons, far right). Always anchored at the top; only the content
              BELOW it swaps between tools and history. */}
          <div className="shrink-0">
            <div className="flex items-center justify-end w-full">
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
                  <div className="flex flex-col gap-fluid-xs flex-1 min-h-0 lg:overscroll-trap">
                    {/* Piece palette — single row (White · divider · Black). */}
                    <div className="w-full shrink-0 overflow-hidden rounded-xl border border-border/40 bg-surface-elevated px-2 py-1.5">
                      <PiecePalette
                        pieceImages={pieceImages}
                        isLoading={isLoading}
                        onKeyboardPick={handlePalettePick}
                      />
                    </div>

                    {/* Display Options — bare on the background (no card), label + free
              checkboxes. */}
                    <div className="w-full shrink-0 px-1">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                        Display Options
                      </span>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <Checkbox
                          checked={showCoords}
                          onChange={(e) => setShowCoords?.(e.target.checked)}
                          label="Show Coordinates"
                          className="p-1!"
                        />
                        <Checkbox
                          checked={showThinFrame}
                          onChange={(e) => setShowThinFrame?.(e.target.checked)}
                          label="Show Board Frame"
                          className="p-1!"
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
                  <div className="flex flex-row items-stretch gap-2 w-full shrink-0 h-10 coarse:h-11">
                    {/* Left group — Undo/Redo are equal-width square icon
                        buttons; Flip matches the same height with a slightly
                        wider footprint for its label, so the three read as one
                        consistent group. */}
                    <div className="flex flex-row items-stretch gap-1.5 shrink-0">
                      {/* Undo / Redo — backed by the board history stack. */}
                      <button
                        type="button"
                        onClick={undo}
                        disabled={!canUndo}
                        className="flex items-center justify-center w-10 coarse:w-11 coarse:min-w-11 rounded-lg border border-border bg-surface-elevated text-text-secondary transition duration-200 ease-out shadow-sm enabled:hover:bg-surface-hover enabled:hover:border-border enabled:hover:text-text-primary enabled:active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                        title="Undo (Ctrl+Z)"
                        aria-label="Undo last change"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={redo}
                        disabled={!canRedo}
                        className="flex items-center justify-center w-10 coarse:w-11 coarse:min-w-11 rounded-lg border border-border bg-surface-elevated text-text-secondary transition duration-200 ease-out shadow-sm enabled:hover:bg-surface-hover enabled:hover:border-border enabled:hover:text-text-primary enabled:active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                        title="Redo (Ctrl+Y)"
                        aria-label="Redo last change"
                      >
                        <Redo2 className="w-4 h-4" />
                      </button>
                      {/* Flip moved here from the top toolbar header. */}
                      <button
                        type="button"
                        onClick={onFlip}
                        className="flex items-center justify-center gap-1.5 px-3 text-sm font-semibold text-text-secondary bg-surface-elevated hover:bg-surface-hover border border-border hover:border-border hover:text-text-primary rounded-lg transition duration-200 ease-out shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]"
                        title="Flip board (F)"
                        aria-label="Flip board orientation"
                      >
                        <Repeat2 className="w-4 h-4" />
                        <span className="hidden xs:inline">Flip</span>
                      </button>
                    </div>

                    {/* Trash zone — resting width is constrained so it sits in
                        balance with the left group rather than greedily filling
                        the bar; it still grows further LEFT while a board piece
                        is dragged over it (flex-grow on the active state inside
                        TrashZone). */}
                    <div className="ml-auto h-full w-32 sm:w-40 shrink-0">
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
        positionUrl={payload.positionUrl}
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
