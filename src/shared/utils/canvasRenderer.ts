import { parseFEN } from './fenParser';
import {
  getDisplayCoordinates,
  getSquareBounds,
  isLightSquare,
  type SquarePattern
} from '@chessviewer-org/chess-viewer';

import {
  drawBoardPiece,
  fillBoardSquare,
  isHatchedSquare,
  readSquarePattern
} from './boardPattern';
import { drawCoordinates } from './coordinateCalculations';
import {
  assertBoardArtwork,
  ensurePieceResolution,
  getPieceKey,
  waitForPieceImage
} from './pieceUtils';
import { calculatePositionSurfaceSize } from './compositionCaption';

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
  showThinFrame?: boolean;
  squarePattern?: SquarePattern;
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
    exportQuality = 1,
    showThinFrame = false,
    squarePattern = readSquarePattern()
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
  const presentKeys = new Set<string>();
  for (const row of board) {
    for (const cell of row) {
      const key = getPieceKey(cell);
      if (key) presentKeys.add(key);
    }
  }
  await Promise.all(
    [...presentKeys].map((key) => {
      const image = pieceImages[key];
      return image ? waitForPieceImage(image, 10000) : undefined;
    })
  );

  assertBoardArtwork(board, pieceImages);

  const {
    boardPixels: bPx,
    borderSize: border,
    outline,
    shouldShowFrame: hasFrame,
    frameThickness: frame,
    canvasWidth: cW,
    canvasHeight: cH,
    boardCanvasHeight,
    caption
  } = calculatePositionSurfaceSize(
    bSize,
    showCoords,
    exportQuality,
    showThinFrame,
    fen
  );

  const sq = bPx / 8;
  const targetPiecePx = Math.ceil(sq);
  const resolvedPieces: Record<string, HTMLImageElement> = {};
  await Promise.all(
    [...presentKeys].map(async (key) => {
      const img = pieceImages[key]!;
      resolvedPieces[key] = await ensurePieceResolution(img, targetPiecePx);
    })
  );

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, cW);
  canvas.height = Math.max(1, cH);
  const opaque = format !== 'png';

  try {
    const ctx = canvas.getContext('2d', {
      alpha: !opaque,
      desynchronized: false,
      willReadFrequently: false
    });
    if (!ctx) throw new Error('No canvas context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const offset = hasFrame ? frame : 0;
    const bX = border + offset + outline;
    const bY = offset + outline;
    let lastYield = performance.now();
    const yieldToMain = async () => {
      if (performance.now() - lastYield < 8) return;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      lastYield = performance.now();
    };

    if (opaque) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, cW, cH);
    } else ctx.clearRect(0, 0, cW, cH);
    await yieldToMain();

    if (hasFrame) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, cW, frame);
      ctx.fillRect(0, boardCanvasHeight - frame, cW, frame);
      ctx.fillRect(0, 0, frame, boardCanvasHeight);
      ctx.fillRect(cW - frame, 0, frame, boardCanvasHeight);
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(
      bX - outline,
      bY - outline,
      bPx + outline * 2,
      bPx + outline * 2
    );
    await yieldToMain();

    const fill = {
      light: lightSquare,
      dark: darkSquare,
      pattern: squarePattern
    };
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const [vR, vC] = getDisplayCoordinates(row, col, flipped);
        const { x, y, width, height } = getSquareBounds(vR, vC, sq, bX, bY);
        fillBoardSquare(
          ctx,
          x,
          y,
          width,
          height,
          isLightSquare(row, col),
          fill
        );
      }
    }
    await yieldToMain();

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const pKey = getPieceKey(board[row]?.[col] ?? '');
        if (!pKey) continue;
        const img = resolvedPieces[pKey] ?? pieceImages[pKey];
        if (!img?.complete || img.naturalWidth <= 0) continue;
        const [vR, vC] = getDisplayCoordinates(row, col, flipped);
        const square = getSquareBounds(vR, vC, sq, bX, bY);
        const sz = Math.min(square.width, square.height);
        drawBoardPiece(
          ctx,
          img,
          square.x + (square.width - sz) / 2,
          square.y + (square.height - sz) / 2,
          sz,
          isHatchedSquare(isLightSquare(row, col), fill)
            ? { color: lightSquare, square }
            : null
        );
      }
      await yieldToMain();
    }

    if (showCoords)
      drawCoordinates(ctx, {
        squareSize: sq,
        boardX: bX,
        boardY: bY,
        boardSize: bPx,
        rankBandX: offset,
        fileBandY: bY + bPx + outline,
        bandSize: border,
        flipped
      });
    if (caption.lines.length) {
      ctx.font = `${caption.fontSize}px Arial, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(1, caption.fontSize / 7);
      caption.lines.forEach((line, index) => {
        const y =
          boardCanvasHeight + caption.padding + index * caption.lineHeight;
        ctx.strokeStyle = '#fff';
        ctx.strokeText(line, bX, y);
        ctx.fillStyle = '#000';
        ctx.fillText(line, bX, y);
      });
    }
    await yieldToMain();
    return canvas;
  } catch (err) {
    canvas.width = canvas.height = 0;
    throw err;
  }
}
