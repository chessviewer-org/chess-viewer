import {
  getDisplayCoordinates,
  getSquareBounds,
  isLightSquare,
  parseFEN
} from '@chessviewer-org/chess-viewer';

import { drawCoordinates } from './coordinateCalculations';
import { getPieceKey } from './pieceUtils';
import {
  calculateRenderSurfaceSize,
  shouldForceCoordinateBorder
} from './imageOptimizer';

export interface RenderConfig {
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

export async function createUltraQualityCanvas(
  config: RenderConfig
): Promise<HTMLCanvasElement> {
  const {
    boardSize: bSize,
    showCoords,
    lightSquare,
    darkSquare,
    flipped,
    fen,
    pieceImages,
    format = 'png',
    showCoordinateBorder = true,
    exportQuality = 1,
    showThinFrame = false
  } = config;

  if (
    !bSize ||
    bSize < 1 ||
    !lightSquare ||
    !darkSquare ||
    !fen ||
    !pieceImages ||
    !Object.keys(pieceImages).length
  ) {
    throw new Error('Invalid render config');
  }

  const board = parseFEN(fen);

  await Promise.all(
    Object.values(pieceImages).map(
      (img) =>
        new Promise<void>((res) => {
          if (!img || img.complete) return res();
          const t = setTimeout(done, 10000);
          function done() {
            clearTimeout(t);
            img.onload = img.onerror = null;
            res();
          }
          img.onload = img.onerror = done;
        })
    )
  );

  const {
    boardPixels: bPx,
    borderSize: border,
    shouldShowFrame: hasFrame,
    frameThickness: frame,
    canvasWidth: cW,
    canvasHeight: cH
  } = calculateRenderSurfaceSize(
    bSize,
    showCoords,
    exportQuality,
    showThinFrame
  );

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, cW);
  canvas.height = Math.max(1, cH);

  try {
    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: false,
      willReadFrequently: false
    });
    if (!ctx) throw new Error('No canvas context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const sq = bPx / 8;
    const offset = hasFrame ? frame : 0;
    const bX = border + offset,
      bY = offset;
    const yieldToMain = () => new Promise((res) => setTimeout(res, 0));

    ctx.clearRect(0, 0, cW, cH);
    await yieldToMain();

    if (hasFrame) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, cW, frame);
      ctx.fillRect(0, cH - frame, cW, frame);
      ctx.fillRect(0, 0, frame, cH);
      ctx.fillRect(cW - frame, 0, frame, cH);
    }

    if (
      showCoords &&
      (shouldForceCoordinateBorder(exportQuality) || showCoordinateBorder) &&
      format.startsWith('jp')
    ) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(offset, offset, border, bPx);
      ctx.fillRect(offset, offset + bPx, border + bPx, border);
    }

    const bStroke = Math.max(1, bPx * 0.002);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = bStroke;
    ctx.strokeRect(
      bX - bStroke / 2,
      bY - bStroke / 2,
      bPx + bStroke,
      bPx + bStroke
    );
    await yieldToMain();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const [vR, vC] = getDisplayCoordinates(row, col, flipped);
        ctx.fillStyle = isLightSquare(row, col) ? lightSquare : darkSquare;
        const { x, y, width, height } = getSquareBounds(vR, vC, sq, bX, bY);
        ctx.fillRect(x, y, width, height);

        const pieceChar = board[row]?.[col];
        const pKey = getPieceKey(pieceChar ?? '');
        if (!pKey) continue;
        const img = pieceImages[pKey];
        if (img?.complete && img.naturalWidth > 0) {
          const sz = Math.min(width, height);
          ctx.drawImage(
            img,
            x + (width - sz) / 2,
            y + (height - sz) / 2,
            sz,
            sz
          );
        }
      }
      await yieldToMain();
    }

    if (showCoords)
      drawCoordinates(
        ctx,
        sq,
        border + offset,
        flipped,
        bPx,
        true,
        false,
        bY,
        offset
      );
    await yieldToMain();
    return canvas;
  } catch (err) {
    canvas.width = canvas.height = 0;
    throw err;
  }
}
