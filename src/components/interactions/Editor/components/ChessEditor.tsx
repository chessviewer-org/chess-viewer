import {
  type CSSProperties,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { useDatabaseSearch } from '@/shared/hooks/useDatabaseSearch';
import { useEditorKeyboard } from '@/shared/hooks/useKeyboard';
import { useInteractiveBoard } from '@/shared/hooks/useInteractiveBoard';
import { usePieceImages } from '@/shared/hooks/usePieceImages';
import type { BoardCell } from '@app-types';
import { isFairyFEN } from '@/shared/utils/fenParser';
import {
  buildManualDatabaseUrl,
  MANUAL_PROVIDER_HOME_URL,
  MANUAL_PROVIDER_LABEL,
  type ManualDatabaseProvider
} from '@/shared/utils/databaseSearch';

import { DisplayOptions } from '@/components/features/BoardStyle/DisplayOptions';
import {
  resolveBoardClick,
  type PieceSelection
} from '../../Board/clickSelection';
import {
  type BoardKeyboardApi,
  InteractiveBoard,
  TrashZone
} from '../../Board';
import { PiecePalette } from '../../PiecePalette';
import { FairySymbolPalette } from '../../PiecePalette/FairySymbolPalette';
import { CompositionLegend } from '../../FairySetup/CompositionLegend';
import { CommandBar } from './CommandBar';
import { DatabaseSearchPanel } from './DatabaseSearchPanel';
import styles from '../styles/chess-editor.module.scss';
import { useDragState } from '../hooks/useDragState';
import { useShareBoard } from '../hooks/useShareBoard';
import { ShareDialog } from './ShareDialog';

// Types
export interface ChessEditorProps {
  fen: string;
  variant?: 'standard' | 'fairy';
  onFenChange: (fen: string) => void;
  pieceStyle: string;
  showCoords: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  onFlip?: () => void;
  onDownload?: () => void;
  onCopyImage?: (() => Promise<boolean>) | undefined;
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
  variant = 'standard',
  onFenChange,
  pieceStyle,
  showCoords,
  lightSquare,
  darkSquare,
  flipped,
  onFlip,
  onDownload,
  onCopyImage,
  setShowCoords,
  showThinFrame = false,
  setShowThinFrame,
  onNotify,
  onPieceImagesChange,
  className = ''
}: ChessEditorProps) {
  const paletteMode = variant;
  const [selection, setSelection] = useState<PieceSelection>(null);
  const selectedPalettePiece =
    selection?.source === 'palette' ? selection.piece : null;
  const selectedSquare =
    selection?.source === 'board' ? selection.square : null;
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

  const { pieceImages, error: pieceError } = usePieceImages(pieceStyle, {
    board,
    selectedPiece: selectedPalettePiece
  });

  const { DragProvider: Provider, onDragEnd } = useDragState({
    handlePieceDrop,
    handlePieceRemove
  });

  const handleDeleteSelected = useCallback(() => {
    if (!selectedSquare) return;
    handlePieceRemove(selectedSquare[0], selectedSquare[1]);
    setSelection(null);
  }, [selectedSquare, handlePieceRemove]);

  const boardKeyboardApiRef = useRef<BoardKeyboardApi | null>(null);
  const handleKeyboardApi = useCallback((api: BoardKeyboardApi) => {
    boardKeyboardApiRef.current = api;
  }, []);
  const handlePalettePick = useCallback((piece: BoardCell) => {
    setSelection(null);
    boardKeyboardApiRef.current?.pickUpFromPalette(piece);
  }, []);

  const clearPointerSelection = useCallback(() => setSelection(null), []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    boardKeyboardApiRef.current?.clearHeld();
  }, []);

  const handlePaletteSelect = useCallback((piece: BoardCell) => {
    boardKeyboardApiRef.current?.clearHeld();
    setSelection((prev) =>
      prev?.source === 'palette' && prev.piece === piece
        ? null
        : { source: 'palette', piece }
    );
  }, []);

  const handleBoardSquareSelect = useCallback(
    (row: number, col: number) => {
      boardKeyboardApiRef.current?.clearHeld();
      const result = resolveBoardClick(board, selection, row, col);
      setSelection(result.selection);
      if (result.drop) {
        handlePieceDrop(
          result.drop.piece,
          result.drop.from?.[0],
          result.drop.from?.[1],
          row,
          col,
          result.drop.from === null
        );
      }
    },
    [board, selection, handlePieceDrop]
  );

  useLayoutEffect(() => {
    syncFromFen(fen);
  }, [fen, syncFromFen]);

  useEffect(() => {
    setSelection((prev) => (prev?.source === 'board' ? null : prev));
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

  const { lichess: lichessState, chessdb: chessdbState } =
    useDatabaseSearch(fen);

  const handleOpenManualProvider = useCallback(
    (provider: ManualDatabaseProvider) => {
      const label = MANUAL_PROVIDER_LABEL[provider];
      onNotify?.(
        `${label} requires a login on their site. Log in at ${MANUAL_PROVIDER_HOME_URL[provider]}, then run the search there.`,
        'info'
      );
      window.open(
        buildManualDatabaseUrl(provider, fen),
        '_blank',
        'noopener,noreferrer'
      );
    },
    [fen, onNotify]
  );

  const [isShareOpen, setIsShareOpen] = useState(false);
  const handleShare = useCallback(() => setIsShareOpen(true), []);
  const closeShare = useCallback(() => setIsShareOpen(false), []);

  const { payload, copyLink } = useShareBoard({
    fen,
    ...(onNotify ? { onNotify } : {})
  });
  const handleCopyLink = useCallback(() => void copyLink(), [copyLink]);

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
    onCopyImage: onCopyImage ?? (async () => false),
    onShare: handleShare,
    onDownload
  };

  return (
    <Provider onDragStart={clearSelection} onDragEnd={onDragEnd}>
      <div
        data-palette-mode={paletteMode}
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
                  <div className={styles.editorBoardContainer}>
                    <InteractiveBoard
                      board={board}
                      lightSquare={lightSquare}
                      darkSquare={darkSquare}
                      pieceImages={pieceImages}
                      flipped={flipped}
                      onPieceDrop={handlePieceDrop}
                      onSquareSelect={handleBoardSquareSelect}
                      selectedSquare={selectedSquare}
                      onPieceRemove={handlePieceRemove}
                      onKeyboardApi={handleKeyboardApi}
                      onKeyboardInteraction={clearPointerSelection}
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
                '--board-frame': showThinFrame ? '2.5px' : '0px'
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
              {variant === 'fairy' ? (
                <FairySymbolPalette
                  pieceStyle={pieceStyle}
                  onKeyboardPick={handlePalettePick}
                  selectedPiece={selectedPalettePiece}
                  onSelect={handlePaletteSelect}
                />
              ) : (
                <PiecePalette
                  pieceImages={pieceImages}
                  onKeyboardPick={handlePalettePick}
                  selectedPiece={selectedPalettePiece}
                  onSelect={handlePaletteSelect}
                />
              )}
              {pieceError && (
                <p role="alert" className="text-sm text-error">
                  {pieceError}. Reload to try again.
                </p>
              )}
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
                fairyPosition={isFairyFEN(fen)}
                lichess={lichessState}
                chessdb={chessdbState}
                onOpenManualProvider={handleOpenManualProvider}
              />
            </div>
            <div className={styles.editorTrash}>
              <TrashZone className="h-full w-full rounded-lg" />
            </div>
          </div>
        </div>

        <CompositionLegend fen={fen} pieceImages={pieceImages} />
        <div className={styles.editorDbRow}>
          <DatabaseSearchPanel
            fairyPosition={isFairyFEN(fen)}
            lichess={lichessState}
            chessdb={chessdbState}
            onOpenManualProvider={handleOpenManualProvider}
          />
        </div>

        <ShareDialog
          isOpen={isShareOpen}
          onClose={closeShare}
          fen={fen}
          positionUrl={payload.positionUrl}
          onCopyLink={handleCopyLink}
        />
      </div>
    </Provider>
  );
});

ChessEditor.displayName = 'ChessEditor';
