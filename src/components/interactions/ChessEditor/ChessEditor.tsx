import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { DndContext, DragOverlay } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

import { FileCoordinates, RankCoordinates } from '@/components/board';
import {
  useDatabaseSearch,
  useEditorKeyboard,
  useInteractiveBoard,
  usePieceImages
} from '@hooks';
import type { PieceSymbol } from '@app-types';

import type { ExportConfig } from '@utils';
import { Checkbox } from '@shared/ui';
import type { BoardKeyboardApi } from '../InteractiveBoard';
import { InteractiveBoard } from '../InteractiveBoard';
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
  exportQuality = 2,
  showCoordinateBorder = true,
  onNotify,
  onPieceImagesChange,
  className = ''
}: ChessEditorProps) {
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);
  const { boardSize, gutterSize, containerRef } =
    useEditorBoardSize(showCoords);
  const cellSize = useMemo(() => boardSize / 8, [boardSize]);

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

  const handleCopyFen = useCallback(() => {
    void navigator.clipboard.writeText(fen);
  }, [fen]);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const handleShare = useCallback(() => setIsShareOpen(true), []);
  const closeShare = useCallback(() => setIsShareOpen(false), []);

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

  const boardTotalH = boardSize + (showCoords ? gutterSize : 0);

  const commandBarProps = {
    onUndo: undo,
    onRedo: redo,
    canUndo,
    canRedo,
    onFlip: onFlip ?? (() => {}),
    onCopyImage: handleCopyFen,
    onShare: handleShare,
    onDownload
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={containerRef}
        className={`${styles.editorRoot} ${className}`}
        onClick={clearSelection}
      >
        <div className={styles.editorMainRow}>
          {/* ── Board column ── */}
          <div className={styles.editorBoardCol}>
            <div className={styles.editorBoardWrap}>
              <div className={styles.editorCommandbarTop}>
                <div className="flex items-center justify-end w-full">
                  <CommandBar {...commandBarProps} />
                </div>
                <div className={styles.editorCommandbarSeparator} />
              </div>

              <div className={styles.editorBoardInner}>
                {showCoords && <RankCoordinates flipped={flipped} />}
                <div
                  className={`${styles.editorBoardContainer} ${showThinFrame ? 'box-border border-2' : ''}`}
                  style={showThinFrame ? { borderColor: darkSquare } : {}}
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

              {showCoords && <FileCoordinates flipped={flipped} />}

              {isLoading && (
                <div
                  className="absolute flex flex-col items-center justify-center bg-surface z-30"
                  style={{
                    top: 0,
                    bottom: 0,
                    left: showCoords ? 'var(--gutter-size)' : 0,
                    right: 0
                  }}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-4 border-border" />
                      <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                    </div>
                    <div className="text-text-primary text-sm font-semibold animate-pulse text-center px-4 wrap-break-word">
                      Loading pieces...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right panel ── */}
          <div
            className={styles.editorPanel}
            style={{ '--board-h': `${boardTotalH}px` } as CSSProperties}
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

            <div className={styles.editorTrash}>
              <TrashZone className="h-full w-full rounded-lg" />
            </div>

            <div className={styles.editorDbSearch}>
              <DatabaseSearchPanel
                lichess={lichessState}
                chessdb={chessdbState}
                pdb={pdbState}
                yacpdb={yacpdbState}
                className="flex-1 min-h-0"
              />
            </div>
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

export default ChessEditor;
