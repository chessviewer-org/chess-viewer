export interface CoordinateParams {
  fontSize: number;
  borderSize: number;
  fontWeight: number;
  offset: number;
}

export interface TextMetricsExt {
  ascent: number;
  descent: number;
  height: number;
}

/**
 * Calculates coordinate label display parameters based on board pixel size.
 *
 * @param {number} boardSize - Board width/height in pixels
 * @returns {CoordinateParams} Dynamic font and layout parameters
 */
export function getCoordinateParams(boardSize: number): CoordinateParams {
  const borderSize = Math.round(Math.max(18, Math.min(800, boardSize * 0.05)));
  const fontSize = Math.round(Math.max(10, Math.min(480, borderSize * 0.72)));
  return {
    fontSize,
    borderSize,
    fontWeight: 600,
    offset: Math.round(borderSize / 2),
  };
}

/** Center pixel of the square at the given index. */
function getCellCenter(borderSize: number, squareSize: number, index: number): number {
  const start = Math.round(borderSize + index * squareSize);
  const end = Math.round(borderSize + (index + 1) * squareSize);
  return Math.round((start + end) / 2);
}

/** Measures text ascent/descent from the canvas context. */
function getTextMetrics(ctx: CanvasRenderingContext2D, sample: string, fontSize: number): TextMetricsExt {
  const metrics = ctx.measureText(sample);
  let ascent = fontSize * 0.8;
  if (Number.isFinite(metrics.actualBoundingBoxAscent)) {
    ascent = metrics.actualBoundingBoxAscent;
  }
  let descent = fontSize * 0.2;
  if (Number.isFinite(metrics.actualBoundingBoxDescent)) {
    descent = metrics.actualBoundingBoxDescent;
  }
  return { ascent, descent, height: ascent + descent };
}

/** Gets the vertical baseline offset for centering. */
function getBaselineFromCenter(centerY: number, metrics: TextMetricsExt): number {
  return Math.round(centerY + (metrics.ascent - metrics.descent) / 2);
}

/**
 * Draws rank and file coordinate labels onto a canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} squareSize - Pixel size of one square
 * @param {number} borderSize - Width of the coordinate border area
 * @param {boolean} flipped - Whether the board is flipped
 * @param {number} boardSize - Total board pixel size (excluding border)
 * @param {boolean} [forExport=false] - Use black text for export output
 * @param {boolean} [displayWhite=true] - Use white text for dark backgrounds
 * @param {number} [boardStartY] - Override Y offset of the board origin
 */
export function drawCoordinates(
  ctx: CanvasRenderingContext2D,
  squareSize: number,
  borderSize: number,
  flipped: boolean,
  boardSize: number,
  forExport: boolean = false,
  displayWhite: boolean = true,
  boardStartY?: number
): void {
  const coordParams = getCoordinateParams(boardSize);
  const { fontSize, fontWeight } = coordParams;
  const effectiveBorder = borderSize ?? coordParams.borderSize;
  
  const boardY = boardStartY ?? (forExport ? 0 : effectiveBorder);

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = forExport ? '#000000' : (displayWhite ? '#ffffff' : '#000000');
  ctx.textRendering = 'optimizeLegibility';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const rankMetrics = getTextMetrics(ctx, '8', fontSize);
  const fileMetrics = getTextMetrics(ctx, 'g', fontSize);

  // Draw ranks (1-8)
  for (let row = 0; row < 8; row++) {
    const rank = flipped ? row + 1 : 8 - row;
    const squareTop = boardY + row * squareSize;
    const squareBottom = boardY + (row + 1) * squareSize;
    const centerY = Math.round((squareTop + squareBottom) / 2);
    const yPos = getBaselineFromCenter(centerY, rankMetrics);
    const xPos = Math.round(effectiveBorder * 0.5);
    ctx.fillText(rank.toString(), xPos, yPos);
  }

  // Draw files (a-h)
  for (let col = 0; col < 8; col++) {
    const fileIndex = flipped ? 7 - col : col;
    const file = String.fromCharCode(97 + fileIndex);
    const xPos = getCellCenter(effectiveBorder, squareSize, col);
    const bottomCenter = Math.round(boardY + boardSize + effectiveBorder * 0.55);
    const yPos = getBaselineFromCenter(bottomCenter, fileMetrics);
    ctx.fillText(file, xPos, yPos);
  }

  ctx.restore();
}
