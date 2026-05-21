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
  
  // Track previous state manually to avoid expensive JSON.stringify
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
    if (!canvasRef.current || board.length === 0 || isLoading) {
      return;
    }

    const loadedKeys = Object.keys(pieceImages);
    const loadedCount = loadedKeys.filter(k => pieceImages[k]?.complete).length;
    
    if (loadedCount === 0) return;

    // Simple hash/fingerprint of the board array for quick change detection
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
    
    // Cap render scale at 2 for preview fluidity while keeping sharpness
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

    // Update refs for next frame
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
      desynchronized: true // High performance hint
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

    // Optional subtle board border
    if (showCoords) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(borderSize, borderSize, boardSize, boardSize);
    }

    // Draw squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = isLightSquare(row, col);
        ctx.fillStyle = isLight ? lightSquare : darkSquare;
        const [displayRow, displayCol] = getDisplayCoordinates(row, col, flipped);
        const bounds = getSquareBounds(displayRow, displayCol, squareSize, borderSize, borderSize);
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }

    // Draw pieces
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
          
          // Slight padding for pieces within squares for better aesthetics
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
  }, [board, pieceImages, showCoords, lightSquare, darkSquare, boardSize, flipped, isLoading]);

  useEffect(() => {
    const throttledDraw = rafThrottle(drawBoard);
    throttledDraw();
    return () => {
      throttledDraw.cancel();
    };
  }, [drawBoard]);

  return canvasRef;
}

