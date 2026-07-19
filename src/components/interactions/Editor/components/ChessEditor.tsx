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
  useDatabaseSearch,
  useEditorKeyboard,
  useInteractiveBoard,
  usePieceImages
} from '@hooks';
import type { PieceSymbol } from '@app-types';

import { DisplayOptions } from '@components/features';
import {
  type BoardKeyboardApi,
  InteractiveBoard,
  TrashZone
} from '../../Board';
import { PiecePalette } from '../../PiecePalette';
import { CommandBar } from './CommandBar';
import { DatabaseSearchPanel } from './DatabaseSearchPanel';
import styles from '../styles/chess-editor.module.scss';
import { useDragState } from '../hooks/useDragState';
import { useEditorBoardSize } from '../hooks/useEditorBoardSize';
import { useShareBoard } from '../hooks/useShareBoard';
import { ShareDialog } from './ShareDialog';

// Types
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
  onNotify,
  onPieceImagesChange,
  className = ''
}: ChessEditorProps) {
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);
  const { boardSize, containerRef, boardElementRef } = useEditorBoardSize();

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

  const { DragProvider: Provider, onDragEnd } = useDragState({
    handlePieceDrop,
    handlePieceRemove
  });

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

  const [selectedPalettePiece, setSelectedPalettePiece] =
    useState<PieceSymbol | null>(null);

  const boardKeyboardApiRef = useRef<BoardKeyboardApi | null>(null);
  const handleKeyboardApi = useCallback((api: BoardKeyboardApi) => {
    boardKeyboardApiRef.current = api;
  }, []);
  const handlePalettePick = useCallback((piece: PieceSymbol) => {
    boardKeyboardApiRef.current?.pickUpFromPalette(piece);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setSelectedPalettePiece(null);
    boardKeyboardApiRef.current?.clearHeld();
  }, []);

  const handlePaletteSelect = useCallback((piece: PieceSymbol) => {
    setSelectedPalettePiece((prev) => (prev === piece ? null : piece));
  }, []);

  const handleBoardSquareSelect = useCallback(
    (row: number, col: number) => {
      if (selectedPalettePiece) {
        handlePieceDrop(
          selectedPalettePiece,
          undefined,
          undefined,
          row,
          col,
          true
        );
        return;
      }
      handleSquareSelect(row, col);
    },
    [selectedPalettePiece, handlePieceDrop, handleSquareSelect]
  );

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

  const ranks = flipped
    ? ['1', '2', '3', '4', '5', '6', '7', '8']
    : ['8', '7', '6', '5', '4', '3', '2', '1'];
  const files = flipped
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

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
    <Provider onDragEnd={onDragEnd}>
      <div
        ref={containerRef}
        className={`${styles.editorRoot} ${className}`}
        onClick={clearSelection}
      >
        <div className={styles.editorCommandbarTop}>
          <div className="flex items-center justify-end w-full">
            <CommandBar {...commandBarProps} />
          </div>
          <div className={styles.editorCommandbarSeparator} />
        </div>

        <div className={styles.editorMainRow}>
          <div className={styles.editorBoardCol}>
            <div className={styles.editorBoardWrap}>
              <div className={styles.editorBoardInner}>
                <div className="relative w-full aspect-square">
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
                      onSquareSelect={handleBoardSquareSelect}
                      selectedSquare={selectedSquare}
                      paletteActive={selectedPalettePiece !== null}
                      onPieceRemove={handlePieceRemove}
                      onKeyboardApi={handleKeyboardApi}
                    />
                    {showThinFrame && (
                      <div
                        className="absolute pointer-events-none box-border"
                        style={{
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

          <div
            className={styles.editorPanel}
            style={
              {
                '--board-h': `${boardSize}px`
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
                selectedPiece={selectedPalettePiece}
                onSelect={handlePaletteSelect}
              />
            </div>
            <div className={styles.editorDisplayOpts}>
              <DisplayOptions
                showCoords={showCoords}
                setShowCoords={setShowCoords ?? (() => {})}
                showThinFrame={showThinFrame ?? false}
                setShowThinFrame={setShowThinFrame ?? (() => {})}
                hideLabel={true}
              />
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
    </Provider>
  );
});

ChessEditor.displayName = 'ChessEditor';
