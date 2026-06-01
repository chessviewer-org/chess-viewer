import { drawCoordinates } from './coordinateCalculations';
import { parseFEN } from './fenParser';
import {
  calculateExportSize,
  shouldForceCoordinateBorder
} from './imageOptimizer';
import { logger } from './logger';

/**
 * @param {string} fenPiece - FEN piece character
 * @returns {string|null} Image key (e.g. 'wK', 'bP') or null if empty
 */
function getPieceKey(fenPiece) {
  if (!fenPiece) return null;
  const isWhite = fenPiece === fenPiece.toUpperCase();
  const pieceType = fenPiece.toUpperCase();
  return isWhite ? 'w' + pieceType : 'b' + pieceType;
}
/**
 * Renders a chess position to a high-resolution canvas element.
 *
 * @param {Object} config - Render configuration
 * @param {number} config.boardSize - Physical board size in centimetres
 * @param {boolean} config.showCoords - Whether to draw coordinate labels
 * @param {string} config.lightSquare - Light square hex color
 * @param {string} config.darkSquare - Dark square hex color
 * @param {boolean} config.flipped - Whether to flip the board
 * @param {string} config.fen - FEN string
 * @param {Object} config.pieceImages - Loaded piece image map
 * @param {string} [config.format='png'] - Output format
 * @param {number} [config.exportQuality=8] - Quality multiplier
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function createUltraQualityCanvas(config) {
  const boardSizeCm = config.boardSize;
  const showCoords = config.showCoords;
  const lightSquare = config.lightSquare;
  const darkSquare = config.darkSquare;
  const flipped = config.flipped;
  const fen = config.fen;
  const pieceImages = config.pieceImages;
  const format = config.format || 'png';
  let showCoordinateBorder = config.showCoordinateBorder;
  if (showCoordinateBorder === undefined || showCoordinateBorder === null) {
    showCoordinateBorder = true;
  }
  let exportQuality = config.exportQuality;
  if (exportQuality === undefined || exportQuality === null) {
    exportQuality = 8;
  }
  const forceCoordBorder = shouldForceCoordinateBorder(exportQuality);
  const effectiveCoordBorder =
    showCoords && (forceCoordBorder || showCoordinateBorder);
  if (!boardSizeCm || boardSizeCm < 1) {
    throw new Error('Invalid board size: ' + boardSizeCm + 'cm (minimum 1cm)');
  }
  if (!lightSquare || !darkSquare) {
    throw new Error('Square colors are required');
  }
  if (!fen) {
    throw new Error('FEN string is required');
  }
  const board = parseFEN(fen);
  if (!board || !Array.isArray(board) || board.length !== 8) {
    throw new Error('Invalid FEN: Failed to parse board');
  }
  if (!pieceImages || Object.keys(pieceImages).length === 0) {
    throw new Error('Invalid board or piece images');
  }

  /**
   * Resolves once a piece image has finished loading or timed out.
   *
   * @param {HTMLImageElement} img - Piece image element
   * @returns {Promise<void>}
   */
  function waitForPieceImage(img) {
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
  const imagePromises = imageKeys.map((key) =>
    waitForPieceImage(pieceImages[key])
  );
  await Promise.all(imagePromises);
  const exportSize = calculateExportSize(
    boardSizeCm,
    showCoords,
    exportQuality
  );
  const finalBoardPixels = exportSize.boardPixels;
  const borderSize = showCoords ? exportSize.borderSize : 0;
  const showThinFrame = config.showThinFrame || false;
  const shouldShowFrame =
    showThinFrame && (exportQuality === 8 || exportQuality === 16);
  const frameThickness = shouldShowFrame
    ? Math.max(2, Math.round(finalBoardPixels * 0.003))
    : 0;
  const framePadding = shouldShowFrame ? frameThickness * 2 : 0;
  const canvasWidth = Math.round(borderSize + finalBoardPixels + framePadding);
  const canvasHeight = Math.round(finalBoardPixels + borderSize + framePadding);
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', {
    alpha: true,
    desynchronized: false,
    willReadFrequently: false
  });
  const squareSize = finalBoardPixels / 8;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const frameOffset = shouldShowFrame ? frameThickness : 0;
  const boardX = borderSize + frameOffset;
  const boardY = frameOffset;

  /**
   * Calculates pixel bounds for a square at the given board coordinates.
   *
   * @param {number} rowIndex - Visible row index
   * @param {number} colIndex - Visible column index
   * @returns {{ x: number, y: number, width: number, height: number, centerX: number, centerY: number }}
   */
  function getSquareBounds(rowIndex, colIndex) {
    const x0 = boardX + colIndex * squareSize;
    const x1 = boardX + (colIndex + 1) * squareSize;
    const y0 = boardY + rowIndex * squareSize;
    const y1 = boardY + (rowIndex + 1) * squareSize;
    return {
      x: x0,
      y: y0,
      width: x1 - x0,
      height: y1 - y0,
      centerX: (x0 + x1) / 2,
      centerY: (y0 + y1) / 2
    };
  }
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
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
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? lightSquare : darkSquare;
      const drawRow = flipped ? 7 - row : row;
      const drawCol = flipped ? 7 - col : col;
      const bounds = getSquareBounds(drawRow, drawCol);
      ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    }
  }
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const fenPiece = board[row]?.[col];
      if (!fenPiece) continue;
      const pieceKey = getPieceKey(fenPiece);
      const img = pieceImages[pieceKey];
      if (!img || !img.complete || img.naturalWidth === 0) continue;
      const drawRow = flipped ? 7 - row : row;
      const drawCol = flipped ? 7 - col : col;
      const bounds = getSquareBounds(drawRow, drawCol);
      const pieceSize = Math.min(bounds.width, bounds.height);
      const px = bounds.centerX - pieceSize / 2;
      const py = bounds.centerY - pieceSize / 2;
      try {
        ctx.drawImage(img, px, py, pieceSize, pieceSize);
      } catch (err) {
        logger.error('Failed to draw piece ' + pieceKey + ':', err);
      }
    }
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
  return canvas;
}
