import { ChessBoard, isChessBoard } from '@app-types';

import { parseFEN } from './fenParser';
import { getExportMode, shouldForceCoordinateBorder } from './imageOptimizer';
import {
  getPieceKey,
  imageToEmbeddableDataURL,
  waitForPieceImage
} from './svgPieceLoader';
import { sanitizeFileName, sanitizeInput } from './validation';

const SVG_BOARD_PX = 800;
const SVG_COORD_BORDER_RATIO = 0.05;

/** Escapes a value for safe interpolation into a double-quoted XML attribute. */
function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Board render settings for the SVG export path. */
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
}

/**
 * Generates an SVG string representing the chess board position.
 *
 * Piece images are embedded as base64 data URLs so the SVG is self-contained.
 *
 * @param config - Board render configuration
 * @returns SVG markup string
 * @throws If the FEN is invalid or the board cannot be parsed
 */
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
    exportQuality = 1
  } = config;

  const boardPx = SVG_BOARD_PX;
  const squarePx = boardPx / 8;
  const withCoords = !!showCoords;

  const borderPx = withCoords
    ? Math.round(Math.max(18, Math.min(800, boardPx * SVG_COORD_BORDER_RATIO)))
    : 0;

  const withBorder =
    withCoords &&
    (showCoordinateBorder || shouldForceCoordinateBorder(exportQuality));
  const withFrame = !!showThinFrame && getExportMode(exportQuality) === 'print';
  const framePx = withFrame ? Math.max(2, Math.round(boardPx * 0.003)) * 2 : 0;

  const totalWidth = borderPx + boardPx + framePx;
  const totalHeight = boardPx + borderPx + framePx;
  const boardX = borderPx + (withFrame ? framePx / 2 : 0);
  const boardY = withFrame ? framePx / 2 : 0;

  const parsedBoard = parseFEN(fen);
  if (!isChessBoard(parsedBoard)) {
    throw new Error('Invalid FEN: unable to parse board');
  }
  const board: ChessBoard = parsedBoard;

  const pieceDataURLs: Record<string, string> = {};
  await Promise.all(
    Object.values(pieceImages).map((img) => waitForPieceImage(img))
  );

  await Promise.all(
    Object.entries(pieceImages).map(async ([key, img]) => {
      if (img && img.complete && img.naturalWidth > 0) {
        pieceDataURLs[key] = await imageToEmbeddableDataURL(img);
      }
    })
  );

  const fontSize = Math.round(Math.max(10, Math.min(480, borderPx * 0.72)));
  // Match the in-app / canvas-export coordinate font (Inter) so SVG, PNG/JPEG,
  // and the live board render coordinates in the same typeface. The system
  // stack is the fallback for viewers without Inter installed.
  const fontFamily =
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";
  const coordTextColor = '#000000';
  const parts: string[] = [];

  const physicalWidthCm = boardSize * (totalWidth / boardPx);
  const physicalHeightCm = boardSize * (totalHeight / boardPx);

  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `viewBox="0 0 ${totalWidth} ${totalHeight}" ` +
      `width="${physicalWidthCm}cm" height="${physicalHeightCm}cm" ` +
      `role="img" aria-label="Chess Board Position">` +
      `<title>Chess Board Position</title>`
  );

  if (withBorder) {
    parts.push(
      `<rect x="${boardX - borderPx + (withFrame ? framePx / 2 : 0)}" y="${boardY}" ` +
        `width="${borderPx}" height="${boardPx}" fill="#ffffff"/>`
    );
    parts.push(
      `<rect x="${boardX - borderPx + (withFrame ? framePx / 2 : 0)}" y="${boardY + boardPx}" ` +
        `width="${boardPx + borderPx}" height="${borderPx}" fill="#ffffff"/>`
    );
  }

  if (withFrame) {
    const f = framePx / 2;
    parts.push(
      `<rect x="0" y="0" width="${totalWidth}" height="${f}" fill="#333333"/>`,
      `<rect x="0" y="${totalHeight - f}" width="${totalWidth}" height="${f}" fill="#333333"/>`,
      `<rect x="0" y="0" width="${f}" height="${totalHeight}" fill="#333333"/>`,
      `<rect x="${totalWidth - f}" y="0" width="${f}" height="${totalHeight}" fill="#333333"/>`
    );
  }

  // stroke-alignment isn't in SVG 1.1, so shift the rect outward by half
  // stroke-width to get an outset stroke (no overlap with the squares).
  const borderStroke = Math.max(1, Math.round(boardPx * 0.002));
  const bHalf = borderStroke / 2;
  parts.push(
    `<rect x="${boardX - bHalf}" y="${boardY - bHalf}" ` +
      `width="${boardPx + borderStroke}" height="${boardPx + borderStroke}" ` +
      `fill="none" stroke="#000000" stroke-width="${borderStroke}"/>`
  );

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const visRow = flipped ? 7 - row : row;
      const visCol = flipped ? 7 - col : col;
      const color = (row + col) % 2 === 0 ? lightSquare : darkSquare;
      const x = boardX + visCol * squarePx;
      const y = boardY + visRow * squarePx;
      parts.push(
        `<rect x="${x}" y="${y}" width="${squarePx}" height="${squarePx}" ` +
          `fill="${sanitizeInput(color)}"/>`
      );
    }
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const fenPiece = board[row]?.[col];
      if (!fenPiece) continue;

      const key = getPieceKey(fenPiece);
      const dataURL = key ? pieceDataURLs[key] : null;
      if (!dataURL) continue;

      const visRow = flipped ? 7 - row : row;
      const visCol = flipped ? 7 - col : col;
      const x = boardX + visCol * squarePx;
      const y = boardY + visRow * squarePx;
      parts.push(
        `<image href="${escapeXmlAttr(dataURL)}" x="${x}" y="${y}" ` +
          `width="${squarePx}" height="${squarePx}" ` +
          `image-rendering="optimizeQuality"/>`
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
      const y = boardY + boardPx + borderPx * 0.7;
      parts.push(
        `<text x="${x}" y="${y}" ${textAttrs}>${sanitizeInput(files[col])}</text>`
      );
    }

    for (let row = 0; row < 8; row++) {
      const x = boardX - borderPx * 0.5;
      const y = boardY + row * squarePx + squarePx / 2 + fontSize * 0.35;
      parts.push(
        `<text x="${x}" y="${y}" ${textAttrs}>${sanitizeInput(ranks[row])}</text>`
      );
    }
  }
  parts.push('</svg>');
  return parts.join('\n');
}

/**
 * Generates an SVG of the board position and triggers a browser download.
 *
 * @param config - Board render configuration
 * @param fileName - Base name for the downloaded file (without extension)
 * @param onProgress - Optional progress callback
 * @throws If rendering fails or required config fields are missing
 */
export async function downloadSVG(
  config: SVGExportConfig,
  fileName: string,
  onProgress?: (progress: number, label?: string | null) => void
): Promise<void> {
  try {
    if (!config) throw new Error('Config is null or undefined');
    if (!config.fen) throw new Error('FEN is missing');
    if (!config.pieceImages || Object.keys(config.pieceImages).length === 0) {
      throw new Error('pieceImages is empty or missing');
    }
    const safeFileName = sanitizeFileName(fileName);
    onProgress?.(5, 'Preparing');
    const svgString = await generateBoardSVG(config);
    onProgress?.(80, 'SVG ready');
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.svg`;
    document.body.appendChild(link);
    link.click();
    onProgress?.(100, 'Done');
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err: unknown) {
    throw new Error(
      `SVG export failed: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }
}
