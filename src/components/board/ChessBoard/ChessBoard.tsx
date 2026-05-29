import { forwardRef, memo, useImperativeHandle } from 'react';

import { useChessBoard, usePieceImages } from '@hooks';

import { useBoardCanvas } from './useBoardCanvas';

/** Props for the `ChessBoard` canvas component. */
interface ChessBoardProps {
  fen: string;
  pieceStyle: string;
  showCoords: boolean;
  lightSquare: string;
  darkSquare: string;
  boardSize: number;
  flipped: boolean;
}

/** Imperative handle exposed via `forwardRef` on `ChessBoard`. */
export interface ChessBoardRef {
  getPieceImages: () => Record<string, HTMLImageElement>;
  getBoardState: () => string[][];
  getCanvas: () => HTMLCanvasElement | null;
}

const ChessBoard = forwardRef<ChessBoardRef, ChessBoardProps>((props, ref) => {
  const {
    fen,
    pieceStyle,
    showCoords,
    lightSquare,
    darkSquare,
    boardSize,
    flipped
  } = props;

  const {
    pieceImages,
    isLoading,
    error: pieceError,
    loadProgress
  } = usePieceImages(pieceStyle);
  const { board, error: fenError } = useChessBoard(fen);

  const { canvasRef, wrapperRef } = useBoardCanvas({
    board,
    pieceImages,
    showCoords,
    lightSquare,
    darkSquare,
    boardSize,
    flipped,
    isLoading
  });

  useImperativeHandle(ref, () => ({
    getPieceImages: () => pieceImages,
    getBoardState: () => board,
    getCanvas: () => canvasRef.current
  }));

  const boardDescription = fen
    ? `Chess board showing position: ${fen.split(' ')[0]}`
    : 'Empty chess board';
  const combinedError = fenError || pieceError;

  return (
    <div
      ref={wrapperRef}
      className="relative block w-full max-w-full"
      role="img"
      aria-label={boardDescription}
    >
      <canvas
        ref={canvasRef}
        className="block max-w-none"
        style={{
          display: 'block',
          imageRendering: 'auto',
          background: 'transparent'
        }}
        aria-hidden="true"
      />

      {isLoading && <BoardLoadingOverlay progress={loadProgress} />}

      {combinedError && <BoardErrorOverlay message={combinedError} />}
    </div>
  );
});

ChessBoard.displayName = 'ChessBoard';

const BoardLoadingOverlay = memo(({ progress }: { progress: number }) => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center bg-surface"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12 sm:w-16 sm:h-16">
        <div className="absolute inset-0 rounded-full border-4 border-border"></div>
        <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
      </div>
      <div className="text-text-primary text-sm font-semibold">
        Loading pieces {progress}%
      </div>
    </div>
  </div>
));

BoardLoadingOverlay.displayName = 'BoardLoadingOverlay';

const BoardErrorOverlay = memo(({ message }: { message: string }) => (
  <div
    className="absolute inset-0 flex items-center justify-center bg-error/10 border-2 border-error/50"
    role="alert"
    aria-live="assertive"
  >
    <div className="text-error text-sm font-semibold px-6 py-4 bg-surface rounded-lg shadow-lg text-center max-w-xs">
      {message}
    </div>
  </div>
));

BoardErrorOverlay.displayName = 'BoardErrorOverlay';

export default memo(ChessBoard);
