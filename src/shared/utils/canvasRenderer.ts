import { drawCoordinates, getSquareBounds } from './coordinateCalculations';
import { parseFEN } from './fenParser';
import {
  calculateRenderSurfaceSize,
  shouldForceCoordinateBorder
} from './imageOptimizer';
import { logger } from './logger';

interface RenderConfig {
  boardSize: number;
  showCoords: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  fen: string;
  pieceImages: Record<string, HTMLImageElement>;
  format?: 'png' | 'jpeg' | 'jpg';
  exportQuality?: number;
  showCoordinateBorder?: boolean;
  showThinFrame?: boolean;
}

/**
 * Returns the image key for a FEN piece character.
 *
 * @param fenPiece - FEN piece character (e.g. 'P', 'k')
 * @returns Image key (e.g. 'wP', 'bk') or null if empty
 */
function getPieceKey(fenPiece: string): string | null {
  if (!fenPiece) return null;
  const isWhite = fenPiece === fenPiece.toUpperCase();
  const pieceType = fenPiece.toUpperCase();
  return isWhite ? 'w' + pieceType : 'b' + pieceType;
}

/**
 * Renders a chess position to a high-resolution canvas element.
 *
 * @param config - Render configuration options
 * @returns Promise resolving to a high-quality canvas element
 */
export async function createUltraQualityCanvas(
  config: RenderConfig
): Promise<HTMLCanvasElement> {
  const {
    boardSize: boardSizeCm,
    showCoords,
    lightSquare,
    darkSquare,
    flipped,
    fen,
    pieceImages,
    format = 'png',
    showCoordinateBorder = true,
    exportQuality = 8,
    showThinFrame = false
  } = config;

  const forceCoordBorder = shouldForceCoordinateBorder(exportQuality);
  const effectiveCoordBorder =
    showCoords && (forceCoordBorder || showCoordinateBorder);

  if (!boardSizeCm || boardSizeCm < 1) {
    throw new Error(`Invalid board size: ${boardSizeCm}cm (minimum 1cm)`);
  }
  if (!lightSquare || !darkSquare) {
    throw new Error('Square colors are required');
  }
  if (!fen) {
    throw new Error('FEN string is required');
  }

  const board = parseFEN(fen);
  if (
    !board ||
    !Array.isArray(board) ||
    board.length !== 8 ||
    board.some((row) => !Array.isArray(row) || row.length !== 8)
  ) {
    throw new Error(
      'Invalid FEN: Failed to parse board or board structure is incorrect'
    );
  }
  if (!pieceImages || Object.keys(pieceImages).length === 0) {
    throw new Error('Invalid board or piece images');
  }

  /**
   * Resolves once a piece image has finished loading or timed out.
   *
   * @param img - The image element to wait for
   * @returns Promise resolving when the image is ready
   */
  function waitForPieceImage(img: HTMLImageElement): Promise<void> {
    if (!img || img.complete) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, 10000);
      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
  }

  const imageKeys = Object.keys(pieceImages);
  const imagePromises = imageKeys.map((key) => {
    const img = pieceImages[key];
    if (img) return waitForPieceImage(img);
    return Promise.resolve();
  });
  await Promise.all(imagePromises);

  const renderSize = calculateRenderSurfaceSize(
    boardSizeCm,
    showCoords,
    exportQuality,
    showThinFrame
  );

  const {
    boardPixels: finalBoardPixels,
    borderSize,
    shouldShowFrame,
    frameThickness,
    canvasWidth,
    canvasHeight
  } = renderSize;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d', {
    alpha: true,
    desynchronized: false,
    willReadFrequently: false
  });

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const squareSize = finalBoardPixels / 8;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const frameOffset = shouldShowFrame ? frameThickness : 0;
  const boardX = borderSize + frameOffset;
  const boardY = frameOffset;

  const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  await yieldToMain();

  if (shouldShowFrame) {
    ctx.fillStyle = '#333333';
    ctx.fillRect(frameOffset, 0, borderSize + finalBoardPixels, frameThickness);
    ctx.fillRect(
      frameOffset,
      frameOffset + finalBoardPixels + borderSize,
      borderSize + finalBoardPixels,
      frameThickness
    );
    ctx.fillRect(0, 0, frameThickness, canvasHeight);
    ctx.fillRect(
      frameOffset + borderSize + finalBoardPixels,
      0,
      frameThickness,
      canvasHeight
    );
  }

  if (effectiveCoordBorder && (format === 'jpeg' || format === 'jpg')) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(frameOffset, frameOffset, borderSize, finalBoardPixels);
    ctx.fillRect(
      frameOffset,
      frameOffset + finalBoardPixels,
      borderSize + finalBoardPixels,
      borderSize
    );
  }

  const boardBorderWidth = Math.max(1, finalBoardPixels * 0.002);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = boardBorderWidth;
  ctx.strokeRect(boardX, boardY, finalBoardPixels, finalBoardPixels);

  await yieldToMain();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? lightSquare : darkSquare;
      const drawRow = flipped ? 7 - row : row;
      const drawCol = flipped ? 7 - col : col;
      const bounds = getSquareBounds(
        drawRow,
        drawCol,
        squareSize,
        boardX,
        boardY
      );
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }

  await yieldToMain();

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const fenPiece = board[row]?.[col];
      if (!fenPiece) continue;

      const pieceKey = getPieceKey(fenPiece);
      if (!pieceKey) continue;

      const img = pieceImages[pieceKey];
      if (!img || !img.complete || img.naturalWidth === 0) continue;

      const drawRow = flipped ? 7 - row : row;
      const drawCol = flipped ? 7 - col : col;
      const bounds = getSquareBounds(
        drawRow,
        drawCol,
        squareSize,
        boardX,
        boardY
      );

      const pieceSize = Math.min(bounds.width, bounds.height);
      const px = bounds.centerX - pieceSize / 2;
      const py = bounds.centerY - pieceSize / 2;

      try {
        ctx.drawImage(img, px, py, pieceSize, pieceSize);
      } catch (err) {
        logger.error(`Failed to draw piece ${pieceKey}:`, err);
      }
    }
    await yieldToMain();
  }

  if (showCoords) {
    drawCoordinates(
      ctx,
      squareSize,
      borderSize + frameOffset,
      flipped,
      finalBoardPixels,
      true,
      false,
      boardY
    );
  }

  await yieldToMain();
  return canvas;
}
