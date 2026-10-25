import {
  hatchLineWidth,
  hatchSegments,
  isSquarePattern,
  pieceHaloRadius,
  type SquareBounds,
  type SquarePattern
} from '@chessviewer-org/chess-viewer';
import { readPreference } from './a11yUtils';

export interface SquareFill {
  light: string;
  dark: string;
  pattern: SquarePattern;
}

export const SQUARE_PATTERN_STORAGE_KEY = 'cv_square_pattern';
export const SQUARE_PATTERN_CHANGE_EVENT = 'cv-square-pattern-change';

export function readSquarePattern(): SquarePattern {
  return readPreference(SQUARE_PATTERN_STORAGE_KEY, isSquarePattern, 'solid');
}

export function fillBoardSquare(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  isLight: boolean,
  fill: SquareFill
): void {
  const hatched = isHatchedSquare(isLight, fill);
  ctx.fillStyle = isLight || hatched ? fill.light : fill.dark;
  ctx.fillRect(x, y, width, height);
  if (!hatched) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.strokeStyle = fill.dark;
  ctx.lineWidth = hatchLineWidth(width);
  ctx.beginPath();
  for (const [x1, y1, x2, y2] of hatchSegments(width)) {
    ctx.moveTo(x + x1, y + y1);
    ctx.lineTo(x + x2, y + y2);
  }
  ctx.stroke();
  ctx.restore();
}

export function isHatchedSquare(isLight: boolean, fill: SquareFill): boolean {
  return !isLight && fill.pattern === 'hatched';
}

function silhouette(
  img: CanvasImageSource,
  size: number,
  color: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = Math.max(1, Math.ceil(size));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.drawImage(img, 0, 0, size, size);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

const HALO_STAMPS = 16;

export function drawBoardPiece(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  size: number,
  halo: {
    color: string;
    square: Pick<SquareBounds, 'x' | 'y' | 'width' | 'height'>;
  } | null
): void {
  if (halo) {
    const { square } = halo;
    const shape = silhouette(img, size, halo.color);
    const radius = pieceHaloRadius(square.width);
    ctx.save();
    ctx.beginPath();
    ctx.rect(square.x, square.y, square.width, square.height);
    ctx.clip();
    for (const r of [radius, radius / 2]) {
      for (let i = 0; i < HALO_STAMPS; i++) {
        const a = (i / HALO_STAMPS) * Math.PI * 2;
        ctx.drawImage(
          shape,
          x + Math.cos(a) * r,
          y + Math.sin(a) * r,
          size,
          size
        );
      }
    }
    ctx.restore();
    shape.width = shape.height = 0;
  }
  ctx.drawImage(img, x, y, size, size);
}
