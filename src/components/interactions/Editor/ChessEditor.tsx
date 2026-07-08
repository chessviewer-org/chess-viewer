import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  DndContext,
  DragOverlay,
  type Modifier,
  pointerWithin
} from '@dnd-kit/core';

import {
  useDatabaseSearch,
  useEditorKeyboard,
  useInteractiveBoard,
  usePieceImages
} from '@hooks';
import type { PieceSymbol } from '@app-types';

import { Checkbox } from '@shared/ui';
import { type BoardKeyboardApi, InteractiveBoard } from '../InteractiveBoard';
import { PiecePalette } from '../PiecePalette';
import { TrashZone } from '../TrashZone';
import styles from './chess-editor.module.scss';
import CommandBar from './parts/CommandBar';
import DatabaseSearchPanel from './parts/DatabaseSearchPanel';
import { DragGhost } from './parts/DragGhost';
import ShareDialog from './parts/ShareDialog';
import { useDragState } from './useDragState';
import { useEditorBoardSize } from './useEditorBoardSize';
import { useShareBoard } from './useShareBoard';

// Centers the DragOverlay ghost on the pointer — fixes the offset when
// dragging from PiecePalette where the drag starts from the element corner.
const snapCenterToCursor: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform
}) => {
  if (!draggingNodeRect || !activatorEvent) return transform;
  const e = activatorEvent as PointerEvent;
  const offsetX =
    e.clientX - (draggingNodeRect.left + draggingNodeRect.width / 2);
  const offsetY =
    e.clientY - (draggingNodeRect.top + draggingNodeRect.height / 2);
  return { ...transform, x: transform.x + offsetX, y: transform.y + offsetY };
};

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
  exportQuality?: number;
  showCoordinateBorder?: boolean;
  onNotify?: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) => void;
  onPieceImagesChange?: (images: Record<string, HTMLImageElement>) => void;
  activeRightPanel?: 'controls' | 'history';
  onSelectHistoryFen?: (fen: string) => void;
  onSendToAdvanced?: (fen: string) => void;
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
  exportQuality: _exportQuality = 2,
  showCoordinateBorder: _showCoordinateBorder = true,
  onNotify,
  onPieceImagesChange,
  className = ''
}: ChessEditorProps) {
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);
  // `cellSize` is measured from the real board element (boardElementRef) so the
  // drag ghost matches the on-board pieces even when CSS max-width clamps the
  // board below the editor-container width on large screens.
  const { boardSize, cellSize, containerRef, boardElementRef } =
    useEditorBoardSize();

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

  const {
    sensors,
    activeDragData,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  } = useDragState({ handlePieceDrop, handlePieceRemove });

  const [selectedSquare, setSelectedSquare] = useState<
    readonly [number, number] | null
  >(null);

  const handleSquareSelect = useCallback((row: number, col: number) => {
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
  useEditorKeyboard(keyboardActions);

  useEffect(() => {
    onPieceImagesChange?.(pieceImages);
  }, [pieceImages, onPieceImagesChange]);

  const {
    lichess: lichessState,
    chessdb: chessdbState,
    pdb: pdbState,
    yacpdb: yacpdbState
  } = useDatabaseSearch(fen);

  // PDB/YACPDB are slow problem databases (their matrix search can take ~30-40s).
  // Warn the user the first time they trigger EITHER slow lookup so the long
  // "Searching…" state reads as expected, not broken. Shown ONCE per session
  // (a ref, not state — no re-render) regardless of which of the two they press
  // or how many times. Stable identity keeps the memo'd panel from re-rendering.
  const slowSearchNotified = useRef(false);
  const notifySlowSearch = useCallback(() => {
    if (slowSearchNotified.current) return;
    slowSearchNotified.current = true;
    onNotify?.(
      'PDB/YACPDB are slow databases — this lookup can take up to ~40 seconds.',
      'warning'
    );
  }, [onNotify]);

  const handleCopyFen = useCallback(() => {
    void navigator.clipboard.writeText(fen);
  }, [fen]);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const handleShare = useCallback(() => setIsShareOpen(true), []);
  const closeShare = useCallback(() => setIsShareOpen(false), []);

  const { payload, copyLink } = useShareBoard({
    fen,
    ...(onNotify ? { onNotify } : {})
  });

  const boardTotalH = boardSize;

  const ranks = flipped
    ? ['1', '2', '3', '4', '5', '6', '7', '8']
    : ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = flipped
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  const handleOpenFolder = useCallback(() => {
    onNotify?.('Coming soon — stay tuned!', 'info');
  }, [onNotify]);

  const commandBarProps = {
    onUndo: undo,
    onRedo: redo,
    canUndo,
    canRedo,
    onFlip: onFlip ?? (() => {}),
    onCopyImage: handleCopyFen,
    onShare: handleShare,
    onOpenFolder: handleOpenFolder,
    onDownload
  };

  return (
    <DndContext
      sensors={sensors}
      // `pointerWithin` targets the square the cursor is actually inside, not the
      // one the ghost rect overlaps most. The default (`rectIntersection`) lets a
      // ghost that is even slightly larger/offset than the cell claim a neighbour
      // square — dropping on e4 would commit to f4. Chess needs cursor-accurate
      // collision, so this strategy is mandatory.
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={containerRef}
        className={`${styles.editorRoot} ${className}`}
        onClick={clearSelection}
      >
        {/* CommandBar: full-width above board+panel on mobile and tablet */}
        <div className={styles.editorCommandbarTop}>
          <div className="flex items-center justify-end w-full">
            <CommandBar {...commandBarProps} />
          </div>
          <div className={styles.editorCommandbarSeparator} />
        </div>

        <div className={styles.editorMainRow}>
          {/* ── Board column ── */}
          <div className={styles.editorBoardCol}>
            <div className={styles.editorBoardWrap}>
              <div className={styles.editorBoardInner}>
                <div className="relative w-full aspect-square">
                  {/* Coordinates gutters always take up 5% space. Board always takes 95% space. */}
                  <div
                    ref={boardElementRef}
                    className={styles.editorBoardContainer}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '95%',
                      height: '95%'
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
                    {showThinFrame && (
                      <div
                        className="absolute pointer-events-none box-border"
                        style={{
                          // Board frame drawn OUTWARD on all four edges INCLUDING
                          // the top a8–h8 edge. The overlay is a real element
                          // pushed 2.5px beyond every board edge, so the frame
                          // owns its own space and never depends on a coordinate
                          // gutter being present — that's why it now also shows
                          // above the top rank, where there is no gutter. It
                          // never eats playable square area. From the board
                          // outward: 0.5px crisp black, then 2px default frame.
                          inset: '-2.5px',
                          border: `2px solid ${darkSquare}`,
                          boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.9)',
                          zIndex: 10
                        }}
                      />
                    )}
                  </div>
                  {showCoords && (
                    <>
                      <div
                        className="absolute top-0 left-0 flex flex-col pr-1"
                        style={{ width: '5%', height: '95%' }}
                      >
                        {ranks.map((rank) => (
                          <div
                            key={rank}
                            className="flex items-center justify-center text-[min(14px,3.5vw)] font-bold text-text-secondary h-[12.5%]"
                          >
                            {rank}
                          </div>
                        ))}
                      </div>
                      <div
                        className="absolute bottom-0 right-0 flex pt-1"
                        style={{ width: '95%', height: '5%' }}
                      >
                        {files.map((file) => (
                          <div
                            key={file}
                            className="flex-1 flex items-center justify-center text-[min(14px,3.5vw)] font-bold text-text-secondary"
                          >
                            {file}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div
            className={styles.editorPanel}
            style={
              {
                '--board-h': `${boardTotalH}px`,
                // Coords occupy 5% of the board wrapper below the squares.
                // Pad the panel bottom by the same amount so trash aligns with
                // the bottom of the board squares, not the coord row.
                // cellSize×8 = real rendered board width (= height, aspect 1:1).
                // Coord gutters are 5% of that, so pad the panel bottom by 5%
                // to align trash with the board squares, not the coord row.
                paddingBottom: showCoords ? `${cellSize * 8 * 0.05}px` : '0'
              } as CSSProperties
            }
          >
            <div className={styles.editorCommandbarPanel}>
              <div className="flex items-center justify-end w-full">
                <CommandBar {...commandBarProps} />
              </div>
              <div className={styles.editorCommandbarSeparator} />
            </div>

            <div className={styles.editorPaletteCard}>
              <PiecePalette
                pieceImages={pieceImages}
                isLoading={isLoading}
                onKeyboardPick={handlePalettePick}
              />
            </div>
            <div className={styles.editorDisplayOpts}>
              <span className={styles.editorDisplayOptsLabel}>
                Display Options
              </span>
              <div className={styles.editorDisplayOptsChecks}>
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
            <div className={styles.editorDbSearch}>
              <DatabaseSearchPanel
                lichess={lichessState}
                chessdb={chessdbState}
                pdb={pdbState}
                yacpdb={yacpdbState}
                onSlowSearch={notifySlowSearch}
              />
            </div>
            <div className={styles.editorTrash}>
              <TrashZone className="h-full w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Tablet-only: DB search full-width below the board+panel row */}
        <div className={styles.editorDbRow}>
          <DatabaseSearchPanel
            lichess={lichessState}
            chessdb={chessdbState}
            pdb={pdbState}
            yacpdb={yacpdbState}
            onSlowSearch={notifySlowSearch}
          />
        </div>

        <ShareDialog
          isOpen={isShareOpen}
          onClose={closeShare}
          fen={fen}
          positionUrl={payload.positionUrl}
          onCopyLink={() => void copyLink()}
        />
      </div>

      <DragOverlay dropAnimation={null} modifiers={[snapCenterToCursor]}>
        {activeDragData ? (
          <DragGhost
            {...(activeDragData.pieceKey != null
              ? { pieceKey: activeDragData.pieceKey }
              : {})}
            pieceImages={pieceImages}
            cellSize={cellSize}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
});

ChessEditor.displayName = 'ChessEditor';
