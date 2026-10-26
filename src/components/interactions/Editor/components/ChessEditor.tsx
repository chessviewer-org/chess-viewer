import {
  type CSSProperties,
  lazy,
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Suspense
} from 'react';

import { useDatabaseSearch } from '@/shared/hooks/useDatabaseSearch';
import { useEditorKeyboard } from '@/shared/hooks/useKeyboard';
import { useInteractiveBoard } from '@/shared/hooks/useInteractiveBoard';
import { usePieceImages } from '@/shared/hooks/usePieceImages';
import type { BoardCell, ChessBoard } from '@app-types';
import {
  isFairyFEN,
  positionContext,
  serializePosition
} from '@/shared/utils/fenParser';
import type { PreviewMove } from '@/engines/core/types';
import { directMoveAnimation } from '@/engines/animation';
import type { PopeyeMove } from '@/engines/popeye/output';
import { usePopeyeMoves } from '../../Analysis/hooks/usePopeyeMoves';
import { MoveAnimation } from '../../Board/components/MoveAnimation';
import type { BoardArrow } from '@/engines/core/arrows';
import { boardMove, moveDestinations } from '@/engines/rules/position';
import {
  boardsEqual,
  moveBoardCell,
  setBoardCell
} from '../../Board/boardUpdates';
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

const PopeyeMoveChoices = lazy(
  () => import('../../Analysis/components/PopeyeMoveChoices')
);
const ANALYSIS_CLOSE_MS = 180;

const PopeyeAnalysisPanel = lazy(
  () => import('../../Analysis/components/PopeyeAnalysisPanel')
);
const StockfishAnalysisPanel = lazy(
  () => import('../../Analysis/components/StockfishAnalysisPanel')
);

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
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisClosing, setAnalysisClosing] = useState(false);
  const [rulesOn, setRulesOn] = useState(false);
  const [arrows, setArrows] = useState<readonly BoardArrow[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [previewBoard, setPreviewBoard] = useState<ChessBoard | null>(null);
  const [previewMove, setPreviewMove] = useState<PreviewMove | null>(null);
  const [animated, setAnimated] = useState<{
    id: number;
    kind: 'preview' | 'manual';
    move: PreviewMove;
  } | null>(null);
  const animationSequence = useRef(0);
  const analysisPanelId = useId();
  const [selection, setSelection] = useState<PieceSelection>(null);
  const boardKeyboardApiRef = useRef<BoardKeyboardApi | null>(null);
  const clearPointerSelection = useCallback(() => setSelection(null), []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    boardKeyboardApiRef.current?.clearHeld();
  }, []);
  const selectedPalettePiece =
    selection?.source === 'palette' ? selection.piece : null;
  const selectedSquare =
    selection?.source === 'board' ? selection.square : null;
  const {
    board,
    handlePieceDrop,
    handlePieceRemove,
    commitPosition,
    syncFromFen,
    undo,
    redo,
    canUndo,
    canRedo
  } = useInteractiveBoard(fen, onFenChange);

  const enforcing = analysisOpen && rulesOn;
  const hints = useMemo(
    () =>
      enforcing && !previewBoard && selectedSquare
        ? moveDestinations(board, fen, selectedSquare[0], selectedSquare[1])
        : [],
    [enforcing, previewBoard, selectedSquare, board, fen]
  );
  const displayedBoard = analysisOpen && previewBoard ? previewBoard : board;
  const commitPopeyeMove = useCallback(
    (move: PopeyeMove, next: string) => {
      clearSelection();
      setPreviewBoard(null);
      setPreviewMove(null);
      syncFromFen(next);
      setAnimated(
        move.animation
          ? { id: ++animationSequence.current, kind: 'manual', move }
          : null
      );
    },
    [clearSelection, syncFromFen]
  );
  const popeyeMoves = usePopeyeMoves({
    active: enforcing && variant === 'fairy',
    fen,
    board: displayedBoard,
    preview: previewMove,
    onCommit: commitPopeyeMove,
    onNotify
  });
  const movePopeyePiece = popeyeMoves.move;
  const finishAnimation = useCallback(
    (id: number) =>
      setAnimated((current) => (current?.id === id ? null : current)),
    []
  );
  const commitPreviewEdit = useCallback(
    (next: ChessBoard) => {
      if (next === previewBoard) return;
      syncFromFen(serializePosition(next, positionContext(fen)));
      setPreviewBoard(null);
    },
    [fen, previewBoard, syncFromFen]
  );
  const handleDisplayedPieceDrop = useCallback<typeof handlePieceDrop>(
    (piece, fromRow, fromCol, toRow, toCol, fromPalette) => {
      setAnimated(null);
      if (enforcing && variant === 'fairy') {
        if (
          !fromPalette &&
          fromRow !== undefined &&
          fromCol !== undefined &&
          (fromRow !== toRow || fromCol !== toCol)
        )
          void movePopeyePiece(fromRow, fromCol, toRow, toCol);
        return;
      }
      if (enforcing) {
        if (
          previewBoard ||
          fromPalette ||
          fromRow === undefined ||
          fromCol === undefined ||
          (fromRow === toRow && fromCol === toCol)
        )
          return;
        const result = boardMove(
          fen,
          board,
          [fromRow, fromCol],
          [toRow, toCol]
        );
        if (result === 'free')
          handlePieceDrop(piece, fromRow, fromCol, toRow, toCol, false);
        else if (result) {
          commitPosition(result.board, result.fenMetadata);
          setAnimated({
            id: ++animationSequence.current,
            kind: 'manual',
            move: { text: '', board: result.board, animation: result.animation }
          });
        }
        return;
      }
      if (!previewBoard) {
        handlePieceDrop(piece, fromRow, fromCol, toRow, toCol, fromPalette);
        return;
      }
      const next =
        !fromPalette && fromRow !== undefined && fromCol !== undefined
          ? moveBoardCell(previewBoard, fromRow, fromCol, toRow, toCol)
          : setBoardCell(previewBoard, toRow, toCol, piece);
      commitPreviewEdit(next);
    },
    [
      enforcing,
      variant,
      movePopeyePiece,
      fen,
      board,
      previewBoard,
      handlePieceDrop,
      commitPreviewEdit,
      commitPosition
    ]
  );
  const handleDisplayedPieceRemove = useCallback(
    (row: number, col: number) => {
      if (enforcing) return;
      if (previewBoard)
        commitPreviewEdit(setBoardCell(previewBoard, row, col, ''));
      else handlePieceRemove(row, col);
    },
    [enforcing, previewBoard, handlePieceRemove, commitPreviewEdit]
  );
  const { pieceImages, error: pieceError } = usePieceImages(pieceStyle, {
    board: animated?.move.animation
      ? [...board, ...displayedBoard, ...animated.move.animation.before]
      : displayedBoard,
    selectedPiece: selectedPalettePiece
  });

  const { DragProvider: Provider, onDragEnd } = useDragState({
    handlePieceDrop: handleDisplayedPieceDrop,
    handlePieceRemove: handleDisplayedPieceRemove
  });

  const handleDeleteSelected = useCallback(() => {
    if (!selectedSquare) return;
    handleDisplayedPieceRemove(selectedSquare[0], selectedSquare[1]);
    setSelection(null);
  }, [selectedSquare, handleDisplayedPieceRemove]);

  const handleKeyboardApi = useCallback((api: BoardKeyboardApi) => {
    boardKeyboardApiRef.current = api;
  }, []);
  const handlePalettePick = useCallback((piece: BoardCell) => {
    setSelection(null);
    boardKeyboardApiRef.current?.pickUpFromPalette(piece);
  }, []);

  const playFen = useCallback(
    (move: PreviewMove) => {
      if (!move.fen) return;
      clearSelection();
      setPreviewBoard(null);
      setPreviewMove(null);
      commitPosition(move.board, positionContext(move.fen).fenMetadata);
      setAnimated(
        move.animation && boardsEqual(board, move.animation.before)
          ? { id: ++animationSequence.current, kind: 'manual', move }
          : null
      );
    },
    [board, clearSelection, commitPosition]
  );

  const handlePreview = useCallback(
    (next: ChessBoard | null, move?: PreviewMove) => {
      clearSelection();
      setPreviewBoard(next);
      setPreviewMove(move ?? null);
      setAnimated((current) =>
        move?.animation
          ? { id: ++animationSequence.current, kind: 'preview', move }
          : current?.kind === 'manual'
            ? current
            : null
      );
    },
    [clearSelection]
  );

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const closeAnalysis = useCallback(() => {
    setAnimated(null);
    setPreviewMove(null);
    setAnalysisClosing(true);
    closeTimer.current = setTimeout(() => {
      setPreviewBoard(null);
      setAnalysisOpen(false);
      setAnalysisClosing(false);
      requestAnimationFrame(() => {
        const triggers = document.querySelectorAll<HTMLButtonElement>(
          `button[aria-controls="${analysisPanelId}"]`
        );
        [...triggers]
          .find((button) => button.getClientRects().length > 0)
          ?.focus();
      });
    }, ANALYSIS_CLOSE_MS);
  }, [analysisPanelId]);

  const toggleAnalysis = useCallback(() => {
    clearSelection();
    if (analysisOpen && !analysisClosing) {
      closeAnalysis();
      return;
    }
    clearTimeout(closeTimer.current);
    setAnalysisClosing(false);
    setPreviewBoard(null);
    setAnalysisOpen(true);
  }, [analysisOpen, analysisClosing, clearSelection, closeAnalysis]);

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
      const result = resolveBoardClick(displayedBoard, selection, row, col);
      setSelection(result.selection);
      if (result.drop) {
        const before = displayedBoard;
        handleDisplayedPieceDrop(
          result.drop.piece,
          result.drop.from?.[0],
          result.drop.from?.[1],
          row,
          col,
          result.drop.from === null
        );
        if (variant === 'standard' && !enforcing && result.drop.from) {
          const animation = directMoveAnimation(before, result.drop.from, [
            row,
            col
          ]);
          if (animation) {
            const next = moveBoardCell(
              before,
              result.drop.from[0],
              result.drop.from[1],
              row,
              col
            );
            setAnimated({
              id: ++animationSequence.current,
              kind: 'manual',
              move: { text: '', board: next, animation }
            });
          }
        }
      }
    },
    [displayedBoard, selection, handleDisplayedPieceDrop, variant, enforcing]
  );

  useLayoutEffect(() => {
    setPreviewBoard(null);
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
      onEscape: analysisOpen ? closeAnalysis : clearSelection
    }),
    [
      onFlip,
      undo,
      redo,
      handleDeleteSelected,
      clearSelection,
      analysisOpen,
      closeAnalysis
    ]
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
    onDownload,
    onToggleAnalysis: toggleAnalysis,
    analysisOpen: analysisOpen && !analysisClosing,
    analysisPanelId
  };

  const analysisProps = {
    fen,
    id: analysisPanelId,
    closing: analysisClosing,
    onPreview: handlePreview,
    onClose: closeAnalysis,
    onNotify,
    onRulesChange: setRulesOn,
    onArrows: setArrows,
    pieceStyle,
    lightSquare,
    darkSquare,
    flipped
  };

  return (
    <Provider onDragStart={clearSelection} onDragEnd={onDragEnd}>
      <div
        data-palette-mode={paletteMode}
        data-analysis-open={analysisOpen}
        className={`${styles.editorRoot} ${className}`}
        onClick={clearSelection}
      >
        <div className={styles.editorCommandbarTop}>
          <div className={styles.editorCommandbarRow}>
            <CommandBar {...commandBarProps} />
          </div>
          <div className={styles.editorCommandbarSeparator} />
        </div>

        <div className={styles.editorMainRow}>
          <div className={styles.editorBoardCol}>
            <div className={styles.editorBoardWrap}>
              <div className={styles.editorBoardInner}>
                <div className={styles.editorBoardSquare}>
                  <div
                    className={styles.editorBoardContainer}
                    data-animating={animated !== null}
                    aria-busy={popeyeMoves.pending}
                  >
                    <InteractiveBoard
                      board={displayedBoard}
                      lightSquare={lightSquare}
                      darkSquare={darkSquare}
                      pieceImages={pieceImages}
                      flipped={flipped}
                      onPieceDrop={handleDisplayedPieceDrop}
                      onSquareSelect={handleBoardSquareSelect}
                      selectedSquare={selectedSquare}
                      arrows={
                        analysisOpen && !previewBoard ? arrows : undefined
                      }
                      destinations={hints}
                      onPieceRemove={handleDisplayedPieceRemove}
                      onKeyboardApi={handleKeyboardApi}
                      onKeyboardInteraction={clearPointerSelection}
                    />
                    {animated?.move.animation && (
                      <MoveAnimation
                        key={animated.id}
                        id={animated.id}
                        animation={animated.move.animation}
                        board={animated.move.board}
                        pieceImages={pieceImages}
                        flipped={flipped}
                        lightSquare={lightSquare}
                        onDone={finishAnimation}
                      />
                    )}
                    {popeyeMoves.pending && (
                      <span role="status" className={styles.editorMovePending}>
                        Checking move…
                      </span>
                    )}
                    {showThinFrame && (
                      <div
                        className={styles.editorBoardFrame}
                        style={{ '--frame-color': darkSquare } as CSSProperties}
                      />
                    )}
                  </div>
                  {showCoords && (
                    <>
                      <div className={styles.editorRanks}>
                        {ranks.map((rank) => (
                          <div
                            key={rank}
                            className={`${styles.editorCoord} ${styles.editorRank}`}
                          >
                            {rank}
                          </div>
                        ))}
                      </div>
                      <div className={styles.editorFiles}>
                        {files.map((file) => (
                          <div
                            key={file}
                            className={`${styles.editorCoord} ${styles.editorFile}`}
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

          <div className={styles.editorPanel} data-frame={showThinFrame}>
            <div className={styles.editorCommandbarPanel}>
              <div className={styles.editorCommandbarRow}>
                <CommandBar {...commandBarProps} />
              </div>
              <div className={styles.editorCommandbarSeparator} />
            </div>

            <div className={styles.editorPanelBody}>
              {analysisOpen ? (
                <Suspense
                  fallback={
                    <p role="status" className={styles.editorAnalysisLoading}>
                      Loading analysis…
                    </p>
                  }
                >
                  {variant === 'fairy' ? (
                    <PopeyeAnalysisPanel
                      {...analysisProps}
                      previousMove={popeyeMoves.previousMove}
                    />
                  ) : (
                    <StockfishAnalysisPanel
                      {...analysisProps}
                      onPlay={playFen}
                    />
                  )}
                </Suspense>
              ) : (
                <>
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
                        fit
                        pieceImages={pieceImages}
                        onKeyboardPick={handlePalettePick}
                        selectedPiece={selectedPalettePiece}
                        onSelect={handlePaletteSelect}
                      />
                    )}
                    {pieceError && (
                      <p role="alert" className={styles.editorPieceError}>
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
                </>
              )}
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

        {popeyeMoves.choices.length > 1 && (
          <Suspense fallback={null}>
            <PopeyeMoveChoices
              moves={popeyeMoves.choices}
              onPick={popeyeMoves.choose}
              onCancel={popeyeMoves.cancel}
            />
          </Suspense>
        )}
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
