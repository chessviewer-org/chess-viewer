import type { BoardCell } from '@app-types';
import { parseFEN } from './fenParser';
import { parseNamedCell } from './fairyCells';
import { isPopeye, parsePopeye } from './popeye';
import {
  calculateRenderSurfaceSize,
  getMaxCanvasSize,
  type RenderSurfaceSize
} from './imageOptimizer';

export interface CaptionPiece {
  label: string;
  squares: string[];
  cell: BoardCell;
}

export function compositionNotes(source: string): string[] {
  if (!isPopeye(source)) return [];
  const lines: string[] = [];
  for (const command of parsePopeye(source).commands) {
    if (['author', 'title', 'origin', 'remark'].includes(command.keyword))
      lines.push(command.value);
    if (['condition', 'stipulation', 'sstipulation'].includes(command.keyword))
      lines.push(command.value);
    if (command.keyword === 'twin') lines.push(`Twin: ${command.value}`);
  }
  return lines.filter(Boolean);
}

export function compositionPieces(source: string): CaptionPiece[] {
  if (!isPopeye(source)) return [];
  const pieces = new Map<string, CaptionPiece>();
  parseFEN(source).forEach((rank, row) =>
    rank.forEach((cell, col) => {
      const piece = parseNamedCell(cell);
      if (!piece) return;
      const label =
        `${{ w: 'White', b: 'Black', n: 'Neutral' }[piece.color]} ${piece.attributes.join(' ')} ${piece.definition.name} (${piece.walk})`.replace(
          /\s+/g,
          ' '
        );
      const entry = pieces.get(label) ?? { label, squares: [], cell };
      entry.squares.push(`${String.fromCharCode(97 + col)}${8 - row}`);
      pieces.set(label, entry);
    })
  );
  return [...pieces.values()];
}

export function compositionCaption(source: string): string[] {
  return [
    ...compositionNotes(source),
    ...compositionPieces(source).map(
      ({ label, squares }) => `${label}: ${squares.join(', ')}`
    )
  ];
}

export interface CaptionLayout {
  lines: string[];
  height: number;
  fontSize: number;
  lineHeight: number;
  padding: number;
}
export function compositionCaptionLayout(
  source: string,
  boardWidth: number
): CaptionLayout {
  const fontSize = boardWidth * 0.0325;
  const padding = boardWidth * 0.025;
  const lineHeight = fontSize * 1.35;
  const maxCharacters = 54;
  const lines: string[] = [];
  for (const paragraph of compositionCaption(source)) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      if (line && line.length + word.length + 1 > maxCharacters) {
        lines.push(line);
        line = '';
      }
      for (let offset = 0; offset < word.length; offset += maxCharacters) {
        const part = word.slice(offset, offset + maxCharacters);
        if (offset) {
          lines.push(line);
          line = '';
        }
        line += `${line ? ' ' : ''}${part}`;
      }
    }
    if (line) lines.push(line);
  }
  return {
    lines,
    fontSize,
    lineHeight,
    padding,
    height: lines.length
      ? Math.ceil(lines.length * lineHeight + padding * 2)
      : 0
  };
}

export function calculatePositionSurfaceSize(
  boardSizeCm: number,
  showCoords: boolean,
  quality: number,
  showFrame: boolean,
  source: string
): RenderSurfaceSize & { caption: CaptionLayout; boardCanvasHeight: number } {
  const base = calculateRenderSurfaceSize(
    boardSizeCm,
    showCoords,
    quality,
    showFrame
  );
  const caption = compositionCaptionLayout(source, base.boardPixels);
  const height = base.canvasHeight + caption.height;
  const ratio = Math.min(
    1,
    getMaxCanvasSize() / Math.max(base.canvasWidth, height)
  );
  const canvasWidth = Math.round(base.canvasWidth * ratio);
  const canvasHeight = Math.round(height * ratio);
  const effectiveDPI = base.effectiveDPI * ratio;
  return {
    ...base,
    boardPixels: base.boardPixels * ratio,
    borderSize: base.borderSize * ratio,
    outline: base.outline * ratio,
    frameThickness: base.frameThickness * ratio,
    framePadding: base.framePadding * ratio,
    canvasWidth,
    canvasHeight,
    boardCanvasHeight: base.canvasHeight * ratio,
    physicalWidthCm: (canvasWidth / effectiveDPI) * 2.54,
    physicalHeightCm: (canvasHeight / effectiveDPI) * 2.54,
    effectiveDPI,
    scaleFactor: base.scaleFactor * ratio,
    caption: {
      ...caption,
      height: caption.height * ratio,
      fontSize: caption.fontSize * ratio,
      lineHeight: caption.lineHeight * ratio,
      padding: caption.padding * ratio
    }
  };
}
