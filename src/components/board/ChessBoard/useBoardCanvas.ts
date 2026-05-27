import { useCallback, useEffect, useRef } from 'react';
import { 
  getCoordinateParams,
  getSquareBounds, 
  drawCoordinates, 
  isLightSquare,
  getDisplayCoordinates,
  logger, 
  rafThrottle 
} from '@utils';
import { ChessBoard } from '@app-types/chess';

/** Props for the `useBoardCanvas` hook. */
interface UseBoardCanvasProps {
  board: ChessBoard;
  pieceImages: Record<string, HTMLImageElement>;
  showCoords: boolean;
  lightSquare: string;
  darkSquare: string;
  boardSize: number;
  flipped: boolean;
  isLoading: boolean;
}

/**
 * Drives canvas rendering for the `ChessBoard` component.
 *
 * Maintains stable refs for all volatile props so `drawBoard` never needs
 * to be recreated, preventing unnecessary `useEffect` firings. Rendering is
 * throttled via `rafThrottle` and skipped when inputs have not changed.
 *
 * @param props - Board state and display settings.
 * @returns A `RefObject` pointing at the managed `<canvas>` element.
 */
export function useBoardCanvas({
  board,
  pieceImages,
  showCoords,
  lightSquare,
  darkSquare,
  boardSize,
  flipped,
  isLoading
}: UseBoardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTotalSizeRef = useRef<number | null>(null);
  const lastRenderScaleRef = useRef<number | null>(null);

  // Stable refs for volatile props — drawBoard reads these on each call without
  // needing them in its dependency array, keeping it recreatable at zero cost.
  const boardRef = useRef(board);
  const pieceImagesRef = useRef(pieceImages);
  const showCoordsRef = useRef(showCoords);
  const lightSquareRef = useRef(lightSquare);
  const darkSquareRef = useRef(darkSquare);
  const boardSizeRef = useRef(boardSize);
  const flippedRef = useRef(flipped);
  const isLoadingRef = useRef(isLoading);

  boardRef.current = board;
  pieceImagesRef.current = pieceImages;
  showCoordsRef.current = showCoords;
  lightSquareRef.current = lightSquare;
  darkSquareRef.current = darkSquare;
  boardSizeRef.current = boardSize;
  flippedRef.current = flipped;
  isLoadingRef.current = isLoading;

  // Track previous state to skip redraws when nothing has changed.
  const prevPropsRef = useRef({
    boardHash: '',
    showCoords,
    lightSquare,
    darkSquare,
    boardSize,
    flipped,
    loadedCount: 0
  });

  const drawBoard = useCallback(() => {
    const board = boardRef.current;
    const pieceImages = pieceImagesRef.current;
    const showCoords = showCoordsRef.current;
    const lightSquare = lightSquareRef.current;
    const darkSquare = darkSquareRef.current;
    const boardSize = boardSizeRef.current;
    const flipped = flippedRef.current;
    const isLoading = isLoadingRef.current;

    if (!canvasRef.current || board.length === 0 || isLoading) {
      return;
    }

    const loadedKeys = Object.keys(pieceImages);
    const loadedCount = loadedKeys.filter(k => pieceImages[k]?.complete).length;

    if (loadedCount === 0) return;

    const boardHash = board.map(row => row.join('')).join('/');

    const hasChanged =
      prevPropsRef.current.boardHash !== boardHash ||
      prevPropsRef.current.showCoords !== showCoords ||
      prevPropsRef.current.lightSquare !== lightSquare ||
      prevPropsRef.current.darkSquare !== darkSquare ||
      prevPropsRef.current.boardSize !== boardSize ||
      prevPropsRef.current.flipped !== flipped ||
      prevPropsRef.current.loadedCount !== loadedCount;

    if (!hasChanged && lastTotalSizeRef.current !== null) {
      return;
    }

    const canvas = canvasRef.current;
    const borderSize = showCoords ? getCoordinateParams(boardSize).borderSize : 0;
    const totalSize = boardSize + borderSize * 2;
    const deviceScale = window.devicePixelRatio || 1;

    // Capped at 2× — beyond that, memory cost outweighs sharpness gain for previews.
    const renderScale = Math.min(2, deviceScale);

    if (
      lastTotalSizeRef.current !== totalSize ||
      lastRenderScaleRef.current !== renderScale
    ) {
      canvas.width = Math.round(totalSize * renderScale);
      canvas.height = Math.round(totalSize * renderScale);
      canvas.style.width = `${totalSize}px`;
      canvas.style.height = `${totalSize}px`;
      lastTotalSizeRef.current = totalSize;
      lastRenderScaleRef.current = renderScale;
    }

    prevPropsRef.current = {
      boardHash,
      showCoords,
      lightSquare,
      darkSquare,
      boardSize,
      flipped,
      loadedCount
    };

    const ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false,
      desynchronized: true
    });

    if (!ctx) {
      logger.error('Failed to get canvas context');
      return;
    }

    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const squareSize = boardSize / 8;
    ctx.clearRect(0, 0, totalSize, totalSize);

    if (showCoords) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(borderSize, borderSize, boardSize, boardSize);
    }

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = isLightSquare(row, col);
        ctx.fillStyle = isLight ? lightSquare : darkSquare;
        const [displayRow, displayCol] = getDisplayCoordinates(row, col, flipped);
        const bounds = getSquareBounds(displayRow, displayCol, squareSize, borderSize, borderSize);
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const fenPiece = board[row]?.[col];
        if (!fenPiece) continue;

        const color = fenPiece === fenPiece.toUpperCase() ? 'w' : 'b';
        const pieceKey = color + fenPiece.toUpperCase();
        const img = pieceImages[pieceKey];

        if (img && img.complete && img.naturalWidth > 0) {
          const [displayRow, displayCol] = getDisplayCoordinates(row, col, flipped);
          const bounds = getSquareBounds(displayRow, displayCol, squareSize, borderSize, borderSize);

          const padding = squareSize * 0.05;
          const pieceSize = squareSize - (padding * 2);
          const px = bounds.centerX - pieceSize / 2;
          const py = bounds.centerY - pieceSize / 2;

          ctx.drawImage(img, px, py, pieceSize, pieceSize);
        }
      }
    }

    if (showCoords) {
      drawCoordinates(ctx, squareSize, borderSize, flipped, boardSize, false, true);
    }
  }, []);

  useEffect(() => {
    const throttledDraw = rafThrottle(drawBoard);
    throttledDraw();
    return () => {
      throttledDraw.cancel();
    };
  }, [drawBoard, board, pieceImages, showCoords, lightSquare, darkSquare, boardSize, flipped, isLoading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    };
  }, []);

  return canvasRef;
}

