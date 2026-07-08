import { getCoordinateParams } from '@chessviewer-org/chess-viewer';

interface TextMetricsExt {
  ascent: number;
  descent: number;
  height: number;
}

function getCellCenter(
  borderSize: number,
  squareSize: number,
  index: number
): number {
  const start = Math.round(borderSize + index * squareSize);
  const end = Math.round(borderSize + (index + 1) * squareSize);
  return Math.round((start + end) / 2);
}

function getTextMetrics(
  ctx: CanvasRenderingContext2D,
  sample: string,
  fontSize: number
): TextMetricsExt {
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

function getBaselineFromCenter(
  centerY: number,
  metrics: TextMetricsExt
): number {
  return Math.round(centerY + (metrics.ascent - metrics.descent) / 2);
}

export function drawCoordinates(
  ctx: CanvasRenderingContext2D,
  squareSize: number,
  borderSize: number,
  flipped: boolean,
  boardSize: number,
  forExport: boolean = false,
  displayWhite: boolean = true,
  boardStartY?: number,
  frameOffset: number = 0
): void {
  const coordParams = getCoordinateParams(boardSize);
  const { fontSize, fontWeight } = coordParams;
  const effectiveBorder = borderSize ?? coordParams.borderSize;
  const coordBorder = effectiveBorder - frameOffset;

  const boardY = boardStartY ?? (forExport ? 0 : effectiveBorder);

  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = forExport ? '#000000' : displayWhite ? '#ffffff' : '#000000';
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
    const xPos = Math.round(frameOffset + coordBorder * 0.5);
    ctx.fillText(rank.toString(), xPos, yPos);
  }

  for (let col = 0; col < 8; col++) {
    const fileIndex = flipped ? 7 - col : col;
    const file = String.fromCharCode(97 + fileIndex);
    const xPos = getCellCenter(effectiveBorder, squareSize, col);
    const bottomCenter = Math.round(boardY + boardSize + coordBorder * 0.55);
    const yPos = getBaselineFromCenter(bottomCenter, fileMetrics);
    ctx.fillText(file, xPos, yPos);
  }

  ctx.restore();
}
