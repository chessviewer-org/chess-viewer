import { parseFEN } from './fenParser';
import { compositionCaptionLayout } from './compositionCaption';
import { isPopeye } from './popeye';
import { ChessBoard, isChessBoard } from '@app-types';

import {
  boardOutlineWidth,
  getDisplayCoordinates,
  hatchPatternSVG,
  pieceHaloFilterSVG,
  pieceHaloRadius,
  isLightSquare,
  sanitizeInput,
  type SquarePattern
} from '@chessviewer-org/chess-viewer';

import { readSquarePattern } from './boardPattern';
import { shouldForceCoordinateBorder } from './imageOptimizer';
import {
  assertBoardArtwork,
  getPieceKey,
  waitForPieceImage
} from './pieceUtils';
import {
  type PieceVector,
  buildPieceVector,
  fetchPieceSvgText,
  namespacePieceIds
} from './pieceSvg';
import { saveBlob } from './saveBlob';

// Constants
export const SVG_BOARD_PX = 800;
export const SVG_COORD_BORDER_RATIO = 0.05;
const HATCH_ID = 'cv-hatch';
const HALO_ID = 'cv-halo';

// Helpers
export function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Types
interface SVGExportConfig {
  boardSize: number;
  showCoords: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  fen: string;
  pieceImages: Record<string, HTMLImageElement>;
  showCoordinateBorder?: boolean;
  showThinFrame?: boolean;
  exportQuality?: number;
  squarePattern?: SquarePattern;
}

export async function generateBoardSVG(
  config: SVGExportConfig
): Promise<string> {
  const {
    boardSize,
    lightSquare,
    darkSquare,
    flipped,
    fen,
    pieceImages,
    showCoords,
    showCoordinateBorder,
    showThinFrame,
    exportQuality = 1,
    squarePattern = readSquarePattern()
  } = config;
  const hatched = squarePattern === 'hatched';

  const boardPx = SVG_BOARD_PX;
  const squarePx = boardPx / 8;
  const withCoords = !!showCoords;

  const borderPx = withCoords
    ? Math.round(Math.max(18, Math.min(800, boardPx * SVG_COORD_BORDER_RATIO)))
    : 0;

  const withBorder =
    withCoords &&
    (showCoordinateBorder || shouldForceCoordinateBorder(exportQuality));
  const withFrame = !!showThinFrame;
  const framePx = withFrame ? Math.max(2, Math.round(boardPx * 0.003)) * 2 : 0;

  const outline = boardOutlineWidth(boardPx);
  const frameOffset = withFrame ? framePx / 2 : 0;
  const totalWidth = borderPx + boardPx + outline * 2 + framePx;
  const boardCanvasHeight = boardPx + borderPx + outline * 2 + framePx;
  const caption = compositionCaptionLayout(fen, boardPx);
  const totalHeight = boardCanvasHeight + caption.height;
  const boardX = borderPx + outline + frameOffset;
  const boardY = outline + frameOffset;

  const parsedBoard = parseFEN(fen);
  if (!isChessBoard(parsedBoard)) {
    throw new Error('Invalid FEN: unable to parse board');
  }
  const board: ChessBoard = parsedBoard;

  const presentKeys = new Set<string>();
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const k = getPieceKey(board[row]?.[col] ?? '');
      if (k) presentKeys.add(k);
    }
  }

  const pieceVectors = new Map<string, PieceVector>();
  await Promise.all(
    [...presentKeys].map((key) => {
      const image = pieceImages[key];
      return image ? waitForPieceImage(image) : undefined;
    })
  );

  assertBoardArtwork(board, pieceImages);

  await Promise.all(
    [...presentKeys].map(async (key) => {
      const img = pieceImages[key];
      if (!(img && img.complete && img.naturalWidth > 0)) return;
      const src = img.currentSrc || img.src || '';
      const svgText = await fetchPieceSvgText(src);
      const vector = svgText ? buildPieceVector(svgText) : null;
      if (!vector) {
        throw new Error(
          `Vector artwork is unavailable for ${key}. Please retry the SVG export.`
        );
      }
      pieceVectors.set(key, vector);
    })
  );

  const fontSize = Math.round(Math.max(10, Math.min(480, borderPx * 0.72)));
  const fontFamily =
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
  const coordTextColor = '#000000';
  const parts: string[] = [];

  const physicalWidthCm = Number(
    (boardSize * (totalWidth / boardPx)).toFixed(2)
  );
  const physicalHeightCm = Number(
    (boardSize * (totalHeight / boardPx)).toFixed(2)
  );

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `viewBox="0 0 ${totalWidth} ${totalHeight}" ` +
      `width="${physicalWidthCm}cm" height="${physicalHeightCm}cm" ` +
      `role="img" aria-label="Chess Board Position">` +
      `<title>Chess Board Position</title>`
  );

  if (isPopeye(fen))
    parts.push(
      `<metadata id="cv-composition">${escapeXmlAttr(fen)}</metadata>`
    );

  if (pieceVectors.size > 0 || hatched) {
    parts.push('<defs>');
    if (hatched) {
      parts.push(
        hatchPatternSVG(
          HATCH_ID,
          squarePx,
          boardX,
          boardY,
          sanitizeInput(darkSquare)
        ),
        pieceHaloFilterSVG(
          HALO_ID,
          pieceHaloRadius(squarePx),
          sanitizeInput(lightSquare)
        )
      );
    }
    for (const [key, vector] of pieceVectors) {
      const symbolId = `cv-p-${key}`;
      const content = namespacePieceIds(vector, `${symbolId}-`);
      parts.push(
        `<symbol id="${symbolId}" viewBox="${escapeXmlAttr(vector.viewBox)}">${content}</symbol>`
      );
    }
    parts.push('</defs>');
  }

  if (withBorder) {
    const span = boardPx + outline * 2;
    parts.push(
      `<rect x="${frameOffset}" y="${frameOffset}" ` +
        `width="${borderPx}" height="${span}" fill="#ffffff"/>`,
      `<rect x="${frameOffset}" y="${frameOffset + span}" ` +
        `width="${borderPx + span}" height="${borderPx}" fill="#ffffff"/>`
    );
  }

  if (withFrame) {
    const f = framePx / 2;
    parts.push(
      `<rect x="0" y="0" width="${totalWidth}" height="${f}" fill="#333333"/>`,
      `<rect x="0" y="${boardCanvasHeight - f}" width="${totalWidth}" height="${f}" fill="#333333"/>`,
      `<rect x="0" y="0" width="${f}" height="${boardCanvasHeight}" fill="#333333"/>`,
      `<rect x="${totalWidth - f}" y="0" width="${f}" height="${boardCanvasHeight}" fill="#333333"/>`
    );
  }

  parts.push(
    `<rect x="${boardX - outline}" y="${boardY - outline}" ` +
      `width="${boardPx + outline * 2}" height="${boardPx + outline * 2}" fill="#000000"/>`
  );

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const [visRow, visCol] = getDisplayCoordinates(row, col, flipped);
      const isLight = isLightSquare(row, col);
      const color = isLight || hatched ? lightSquare : darkSquare;
      const x = boardX + visCol * squarePx;
      const y = boardY + visRow * squarePx;
      const rect = `<rect x="${x}" y="${y}" width="${squarePx}" height="${squarePx}" `;
      parts.push(`${rect}fill="${sanitizeInput(color)}"/>`);
      if (hatched && !isLight) parts.push(`${rect}fill="url(#${HATCH_ID})"/>`);
    }
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const key = getPieceKey(board[row]?.[col] ?? '');
      if (!key) continue;

      const [visRow, visCol] = getDisplayCoordinates(row, col, flipped);
      const x = boardX + visCol * squarePx;
      const y = boardY + visRow * squarePx;

      const size = `width="${squarePx}" height="${squarePx}"`;
      const piece = `<use href="#cv-p-${key}" xlink:href="#cv-p-${key}" x="0" y="0" ${size}/>`;

      const onHatch = hatched && !isLightSquare(row, col);
      parts.push(
        `<svg x="${x}" y="${y}" ${size}>` +
          (onHatch ? `<g filter="url(#${HALO_ID})">${piece}</g>` : piece) +
          `</svg>`
      );
    }
  }

  if (withCoords) {
    const files = flipped
      ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
      : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = flipped
      ? ['1', '2', '3', '4', '5', '6', '7', '8']
      : ['8', '7', '6', '5', '4', '3', '2', '1'];

    const textAttrs =
      `font-family="${sanitizeInput(fontFamily)}" font-size="${fontSize}" ` +
      `font-weight="600" fill="${sanitizeInput(coordTextColor)}" text-anchor="middle"`;

    for (let col = 0; col < 8; col++) {
      const x = boardX + col * squarePx + squarePx / 2;
      const y = boardY + boardPx + outline + borderPx * 0.55 + fontSize * 0.35;
      parts.push(
        `<text x="${x}" y="${y}" ${textAttrs}>${sanitizeInput(files[col])}</text>`
      );
    }

    for (let row = 0; row < 8; row++) {
      const x = frameOffset + borderPx * 0.5;
      const y = boardY + row * squarePx + squarePx / 2 + fontSize * 0.35;
      parts.push(
        `<text x="${x}" y="${y}" ${textAttrs}>${sanitizeInput(ranks[row])}</text>`
      );
    }
  }
  if (caption.lines.length) {
    parts.push(
      `<g font-family="Arial,sans-serif" font-size="${caption.fontSize}" fill="black" stroke="white" stroke-width="${caption.fontSize / 7}" stroke-linejoin="round" paint-order="stroke fill">`
    );
    caption.lines.forEach((line, index) =>
      parts.push(
        `<text x="${boardX}" y="${boardCanvasHeight + caption.padding + caption.fontSize + index * caption.lineHeight}">${escapeXmlAttr(line)}</text>`
      )
    );
    parts.push('</g>');
  }
  parts.push('</svg>');
  return parts.join('\n');
}

export async function getSVGBlob(
  config: SVGExportConfig,
  onProgress?: (progress: number, label?: string | null) => void
): Promise<Blob> {
  if (!config) throw new Error('Config is null or undefined');
  if (!config.fen) throw new Error('FEN is missing');
  if (!config.pieceImages || Object.keys(config.pieceImages).length === 0) {
    throw new Error('pieceImages is empty or missing');
  }
  onProgress?.(5, 'Preparing');
  const svgString = await generateBoardSVG(config);
  onProgress?.(80, 'SVG ready');
  return new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
}

export async function downloadSVG(
  config: SVGExportConfig,
  fileName: string,
  onProgress?: (progress: number, label?: string | null) => void
): Promise<void> {
  try {
    const blob = await getSVGBlob(config, onProgress);
    saveBlob(blob, fileName, 'svg');
    onProgress?.(100, 'Done');
  } catch (err: unknown) {
    throw new Error(
      `SVG export failed: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
}
