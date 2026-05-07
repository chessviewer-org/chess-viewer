import React, { useCallback, useEffect, useRef, useState } from 'react';

import { usePieceImages } from '@/hooks';
import {
  drawCoordinates,
  getCoordinateParams,
  logger,
  parseFEN,
  rafThrottle
} from '@/utils';

function createEmptyBoard() {
  return Array(8)
    .fill(null)
    .map(() => Array(8).fill(''));
}

function getSquareBounds(rowIndex, colIndex, borderSize, squareSize) {
  const x0 = Math.round(borderSize + colIndex * squareSize);
  const x1 = Math.round(borderSize + (colIndex + 1) * squareSize);
  const y0 = Math.round(borderSize + rowIndex * squareSize);
  const y1 = Math.round(borderSize + (rowIndex + 1) * squareSize);
  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
    centerX: Math.round((x0 + x1) / 2),
    centerY: Math.round((y0 + y1) / 2)
  };
}
/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const ChessBoard = React.forwardRef(function ChessBoard(props, ref) {
  const {
    fen,
    pieceStyle,
    showCoords,
    lightSquare,
    darkSquare,
    boardSize,
    flipped
  } = props;
  const canvasRef = useRef(null);
  const lastTotalSizeRef = useRef(null);
  const { pieceImages, isLoading, error, loadProgress } =
    usePieceImages(pieceStyle);
  const [board, setBoard] = useState([]);
  useEffect(() => {
    if (!fen) {
      return;
    }
    try {
      const parsed = parseFEN(fen);
      if (parsed && Array.isArray(parsed) && parsed.length === 8) {
        setBoard(parsed);
      } else {
        logger.error('FEN parse returned invalid board structure');
        setBoard(createEmptyBoard());
      }
    } catch (err) {
      logger.error('FEN parse error:', err);
      setBoard(createEmptyBoard());
    }
  }, [fen]);
  React.useImperativeHandle(ref, () => ({
    getPieceImages: () => pieceImages,
    getBoardState: () => board,
    getCanvas: () => canvasRef.current
  }));
  const drawBoard = useCallback(() => {
    if (!canvasRef.current || board.length === 0 || isLoading) {
      return;
    }
    if (Object.keys(pieceImages).length === 0) {
      return;
    }
    if (!Array.isArray(board) || board.length !== 8) {
      logger.error('Invalid board structure for rendering');
      return;
    }
    const canvas = canvasRef.current;
    const borderSize = showCoords
      ? getCoordinateParams(boardSize).borderSize
      : 0;
    const totalSize = boardSize + borderSize * 2;
    const scale = 4;
    if (lastTotalSizeRef.current !== totalSize) {
      canvas.width = totalSize * scale;
      canvas.height = totalSize * scale;
      canvas.style.width = totalSize + 'px';
      canvas.style.height = totalSize + 'px';
      lastTotalSizeRef.current = totalSize;
    }
    const ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false,
      desynchronized: true
    });
    if (!ctx) {
      logger.error('Failed to get canvas context');
      return;
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const squareSize = boardSize / 8;
    ctx.clearRect(0, 0, totalSize, totalSize);
    if (showCoords) {
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        borderSize - 0.5,
        borderSize - 0.5,
        boardSize + 1,
        boardSize + 1
      );
    }
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        ctx.fillStyle = isLight ? lightSquare : darkSquare;
        const displayRow = flipped ? 7 - row : row;
        const displayCol = flipped ? 7 - col : col;
        const bounds = getSquareBounds(
          displayRow,
          displayCol,
          borderSize,
          squareSize
        );
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const fenPiece = board[row]?.[col];
        if (!fenPiece) {
          continue;
        }
        const color = fenPiece === fenPiece.toUpperCase() ? 'w' : 'b';
        const pieceKey = color + fenPiece.toUpperCase();
        const img = pieceImages[pieceKey];
        if (img && img.complete && img.naturalWidth > 0) {
          const displayRow = flipped ? 7 - row : row;
          const displayCol = flipped ? 7 - col : col;
          const bounds = getSquareBounds(
            displayRow,
            displayCol,
            borderSize,
            squareSize
          );
          const pieceSize = Math.round(
            Math.min(bounds.width, bounds.height) * 1.0
          );
          const px = Math.round(bounds.centerX - pieceSize / 2);
          const py = Math.round(bounds.centerY - pieceSize / 2);
          ctx.drawImage(img, px, py, pieceSize, pieceSize);
        }
      }
    }
    if (showCoords) {
      drawCoordinates(
        ctx,
        squareSize,
        borderSize,
        flipped,
        boardSize,
        false,
        true
      );
    }
  }, [
    board,
    pieceImages,
    showCoords,
    lightSquare,
    darkSquare,
    boardSize,
    flipped,
    isLoading
  ]);
  useEffect(() => {
    const throttledDraw = rafThrottle(drawBoard);
    throttledDraw();
    return () => {
      throttledDraw.cancel();
    };
  }, [drawBoard]);
  function getBoardDescription() {
    if (!fen) {
      return 'Empty chess board';
    }
    return `Chess board showing position: ${fen.split(' ')[0]}`;
  }
  return (
    <div
      className="relative block w-full max-w-full"
      role="img"
      aria-label={getBoardDescription()}
    >
      <canvas
        ref={canvasRef}
        className="transition-all duration-300 w-full h-auto"
        style={{
          display: 'block',
          imageRendering: 'auto',
          background: 'transparent'
        }}
        aria-hidden="true"
      />
      {isLoading && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-surface/90 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16">
              <div className="absolute inset-0 rounded-full border-4 border-border"></div>
              <div className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
            </div>
            <div className="text-text-primary text-sm font-semibold">
              Loading pieces {loadProgress}%
            </div>
          </div>
        </div>
      )}
      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-error/10 backdrop-blur-sm border-2 border-error/50"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-error text-sm font-semibold px-6 py-4 bg-surface/90 rounded-lg shadow-lg text-center max-w-xs">
            {error}
          </div>
        </div>
      )}
    </div>
  );
});
ChessBoard.displayName = 'ChessBoard';
export default ChessBoard;
