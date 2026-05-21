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
 * @param boardSize - Board width/height in pixels
 * @returns Dynamic font and layout parameters
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

export interface SquareBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Calculates the bounding box and center coordinates for a board square.
 *
 * @param rowIndex - 0-indexed row (0 is top)
 * @param colIndex - 0-indexed column (0 is left)
 * @param squareSize - Size of a single square in pixels
 * @param offsetX - Horizontal offset from canvas origin
 * @param offsetY - Vertical offset from canvas origin
 * @returns Bounding box and center coordinates
 */
export function getSquareBounds(
  rowIndex: number,
  colIndex: number,
  squareSize: number,
  offsetX: number = 0,
  offsetY: number = 0
): SquareBounds {
  const x0 = Math.round(offsetX + colIndex * squareSize);
  const x1 = Math.round(offsetX + (colIndex + 1) * squareSize);
  const y0 = Math.round(offsetY + rowIndex * squareSize);
  const y1 = Math.round(offsetY + (rowIndex + 1) * squareSize);
  return {
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0,
    centerX: Math.round((x0 + x1) / 2),
    centerY: Math.round((y0 + y1) / 2),
  };
}

/**
 * Determines whether a given square index is light or dark.
 * 
 * @param row - 0-indexed row (0 is top)
 * @param col - 0-indexed column (0 is left)
 * @returns True if light, false if dark
 */
export function isLightSquare(row: number, col: number): boolean {
  return (row + col) % 2 === 0;
}

/**
 * Gets the actual row and column indices based on whether the board is flipped.
 * 
 * @param row - Display row index
 * @param col - Display column index
 * @param flipped - Whether the board is viewed from black's perspective
 * @returns Array containing actual row and column [actualRow, actualCol]
 */
export function getDisplayCoordinates(row: number, col: number, flipped: boolean): [number, number] {
  return [
    flipped ? 7 - row : row,
    flipped ? 7 - col : col
  ];
}

/** 
 * Calculates the center pixel of the square at the given index. 
 * 
 * @param borderSize - Width of the border
 * @param squareSize - Size of one square
 * @param index - Index of the square
 * @returns Center coordinate
 */
function getCellCenter(borderSize: number, squareSize: number, index: number): number {
  const start = Math.round(borderSize + index * squareSize);
  const end = Math.round(borderSize + (index + 1) * squareSize);
  return Math.round((start + end) / 2);
}

/** 
 * Measures text ascent/descent from the canvas context. 
 * 
 * @param ctx - Canvas context
 * @param sample - Text to measure
 * @param fontSize - Font size used
 * @returns Object with metrics
 */
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

/** 
 * Gets the vertical baseline offset for centering. 
 * 
 * @param centerY - Center Y coordinate
 * @param metrics - Text metrics
 * @returns Baseline coordinate
 */
function getBaselineFromCenter(centerY: number, metrics: TextMetricsExt): number {
  return Math.round(centerY + (metrics.ascent - metrics.descent) / 2);
}

/**
 * Draws rank and file coordinate labels onto a canvas context.
 *
 * @param ctx - Canvas context
 * @param squareSize - Pixel size of one square
 * @param borderSize - Width of the coordinate border area
 * @param flipped - Whether the board is flipped
 * @param boardSize - Total board pixel size (excluding border)
 * @param forExport - Use black text for export output
 * @param displayWhite - Use white text for dark backgrounds
 * @param boardStartY - Override Y offset of the board origin
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

  for (let row = 0; row < 8; row++) {
    const rank = flipped ? row + 1 : 8 - row;
    const squareTop = boardY + row * squareSize;
    const squareBottom = boardY + (row + 1) * squareSize;
    const centerY = Math.round((squareTop + squareBottom) / 2);
    const yPos = getBaselineFromCenter(centerY, rankMetrics);
    const xPos = Math.round(effectiveBorder * 0.5);
    ctx.fillText(rank.toString(), xPos, yPos);
  }

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
