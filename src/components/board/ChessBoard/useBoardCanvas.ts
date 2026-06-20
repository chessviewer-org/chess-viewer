import { useCallback, useEffect, useRef } from 'react';

import { ChessBoard } from '@app-types/chess';

import {
  drawCoordinates,
  getCoordinateParams,
  getDisplayCoordinates,
  getSquareBounds,
  isLightSquare,
  logger,
  rafThrottle
} from '@utils';

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastTotalSizeRef = useRef<number | null>(null);
  const lastRenderScaleRef = useRef<number | null>(null);

  // Observed wrapper width in CSS px. The on-screen board is rasterized to fill
  // this, not the `boardSize` prop (which is physical-cm for export math). A
  // ResizeObserver keeps the bitmap re-rasterized on container resize so the
  // board never blurs from CSS-only scaling. Falls back to `boardSize` until
  // the first observation lands.
  const containerWidthRef = useRef<number>(boardSize);

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
    renderWidth: 0,
    flipped,
    loadedCount: 0
  });

  const drawBoard = useCallback(() => {
    const board = boardRef.current;
    const pieceImages = pieceImagesRef.current;
    const showCoords = showCoordsRef.current;
    const lightSquare = lightSquareRef.current;
    const darkSquare = darkSquareRef.current;
    const flipped = flippedRef.current;
    const isLoading = isLoadingRef.current;

    if (!canvasRef.current || board.length === 0 || isLoading) {
      return;
    }

    const loadedKeys = Object.keys(pieceImages);
    const loadedCount = loadedKeys.filter(
      (k) => pieceImages[k]?.complete
    ).length;

    if (loadedCount === 0) return;

    const boardHash = board.map((row) => row.join('')).join('/');

    // On-screen extent comes from the observed container, not the prop. The
    // outer square (`totalSize`) fills the wrapper; the 8×8 grid is inset by a
    // proportional coordinate border so labels never clip and the board never
    // overflows or blurs on resize.
    const totalSize = Math.max(0, Math.round(containerWidthRef.current));
    const borderSize = showCoords
      ? Math.min(
          getCoordinateParams(totalSize).borderSize,
          Math.floor(totalSize / 4)
        )
      : 0;
    const playSize = totalSize - borderSize * 2;

    if (totalSize <= 0 || playSize <= 0) return;

    const hasChanged =
      prevPropsRef.current.boardHash !== boardHash ||
      prevPropsRef.current.showCoords !== showCoords ||
      prevPropsRef.current.lightSquare !== lightSquare ||
      prevPropsRef.current.darkSquare !== darkSquare ||
      prevPropsRef.current.renderWidth !== totalSize ||
      prevPropsRef.current.flipped !== flipped ||
      prevPropsRef.current.loadedCount !== loadedCount;

    if (!hasChanged && lastTotalSizeRef.current !== null) {
      return;
    }

    const canvas = canvasRef.current;
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
      renderWidth: totalSize,
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

    const squareSize = playSize / 8;
    ctx.clearRect(0, 0, totalSize, totalSize);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = isLightSquare(row, col);
        ctx.fillStyle = isLight ? lightSquare : darkSquare;
        const [displayRow, displayCol] = getDisplayCoordinates(
          row,
          col,
          flipped
        );
        const bounds = getSquareBounds(
          displayRow,
          displayCol,
          squareSize,
          borderSize,
          borderSize
        );
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }

    // Stroke is drawn after fills so it sits flush on top of the outermost
    // squares with no gap. Offset by half lineWidth so the stroke is fully
    // outside the board area (outset stroke).
    if (showCoords) {
      const lw = 1;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = lw;
      ctx.strokeRect(
        borderSize - lw / 2,
        borderSize - lw / 2,
        playSize + lw,
        playSize + lw
      );
    }

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const fenPiece = board[row]?.[col];
        if (!fenPiece) continue;

        const color = fenPiece === fenPiece.toUpperCase() ? 'w' : 'b';
        const pieceKey = color + fenPiece.toUpperCase();
        const img = pieceImages[pieceKey];

        if (img && img.complete && img.naturalWidth > 0) {
          const [displayRow, displayCol] = getDisplayCoordinates(
            row,
            col,
            flipped
          );
          const bounds = getSquareBounds(
            displayRow,
            displayCol,
            squareSize,
            borderSize,
            borderSize
          );

          const padding = squareSize * 0.05;
          const pieceSize = squareSize - padding * 2;
          const px = bounds.centerX - pieceSize / 2;
          const py = bounds.centerY - pieceSize / 2;

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
        totalSize,
        false,
        true
      );
    }
  }, []);

  useEffect(() => {
    const throttledDraw = rafThrottle(drawBoard);
    throttledDraw();
    return () => {
      throttledDraw.cancel();
    };
  }, [
    drawBoard,
    board,
    pieceImages,
    showCoords,
    lightSquare,
    darkSquare,
    boardSize,
    flipped,
    isLoading
  ]);

  // Re-rasterize on container resize so the bitmap tracks CSS px (no blur).
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === 'undefined') return;

    const throttledDraw = rafThrottle(drawBoard);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const width = entry.contentRect.width;
      if (width > 0 && width !== containerWidthRef.current) {
        containerWidthRef.current = width;
        throttledDraw();
      }
    });

    observer.observe(wrapper);
    return () => {
      observer.disconnect();
      throttledDraw.cancel();
    };
  }, [drawBoard]);

  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    };
  }, []);

  return { canvasRef, wrapperRef };
}
