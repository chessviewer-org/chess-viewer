import { parseFEN } from './fenParser';
import { shouldForceCoordinateBorder } from './imageOptimizer';
import { logger } from './logger';
import { sanitizeFileName, sanitizeInput } from './validation';
import { ChessBoard, isChessBoard } from '../types/index';

const SVG_BOARD_PX = 800;
const SVG_COORD_BORDER_RATIO = 0.05;
const pieceDataUrlCache = new Map<string, string>();

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
 * Returns the image key for a FEN piece character.
 *
 * @param fenPiece - FEN piece character (e.g. 'P', 'k')
 * @returns Image key (e.g. 'wP', 'bk') or null if empty
 */
function getPieceKey(fenPiece: string): string | null {
  if (!fenPiece) return null;
  const isWhite = fenPiece === fenPiece.toUpperCase();
  return (isWhite ? 'w' : 'b') + fenPiece.toUpperCase();
}

/**
 * Converts an image element to a base64 PNG data URL.
 * 
 * @param img - The HTML image element to convert
 * @returns Promise resolving to a base64 data URL
 */
async function imageToDataURL(img: HTMLImageElement): Promise<string> {
  return new Promise((resolve) => {
    try {
      const size = Math.max(img.naturalWidth || 64, img.naturalHeight || 64, 1);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    } catch (err) {
      logger.warn('SVG export: failed to convert piece image to base64:', err);
      resolve('');
    }
  });
}

/**
 * Waits for an image to load or time out.
 * 
 * @param img - The image element to wait for
 * @returns Promise resolving when the image is ready
 */
async function waitForPieceImage(img: HTMLImageElement): Promise<void> {
  if (!img || img.complete) {
    return;
  }
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 10000);
    const onLoad = () => {
      clearTimeout(timeout);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      resolve();
    };
    const onError = () => {
      clearTimeout(timeout);
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      resolve();
    };
    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
  });
}

/**
 * Converts UTF-8 text into a base64 data URL payload.
 * 
 * @param text - The text string to encode
 * @returns Base64 encoded string
 */
function toBase64Utf8(text: string): string {
  const utf8 = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < utf8.length; i += chunkSize) {
    const chunk = utf8.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Returns an embeddable data URL for piece assets, utilizing cache.
 * 
 * @param img - The image element to convert
 * @returns Promise resolving to a data URL
 */
async function imageToEmbeddableDataURL(img: HTMLImageElement): Promise<string> {
  if (!img) return '';
  const src = img.currentSrc || img.src || '';
  if (!src) return '';
  
  const cached = pieceDataUrlCache.get(src);
  if (cached) return cached;

  let dataUrl = '';
  if (src.startsWith('data:')) {
    dataUrl = src;
  } else {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(src);
    } catch {
      logger.warn('SVG export: rejecting piece src with unparseable URL:', src);
      return '';
    }
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      logger.warn('SVG export: rejecting piece src with disallowed protocol:', parsedUrl.protocol);
      return '';
    }

    const lowerSrc = src.toLowerCase();
    const isSvgSource = lowerSrc.endsWith('.svg') || lowerSrc.includes('image/svg+xml');

    if (isSvgSource) {
      try {
        const response = await fetch(src, { cache: 'force-cache' });
        if (response.ok) {
          const svgText = await response.text();
          dataUrl = `data:image/svg+xml;base64,${toBase64Utf8(svgText)}`;
        }
      } catch (err) {
        logger.warn('SVG export: failed to inline vector piece source:', err);
      }
    }
  }

  if (!dataUrl) {
    dataUrl = await imageToDataURL(img);
  }
  
  pieceDataUrlCache.set(src, dataUrl);
  return dataUrl;
}

/**
 * Generates an SVG string representing the full chess board with pieces.
 *
 * @param config - Board configuration options
 * @returns Promise resolving to the SVG markup string
 */
export async function generateBoardSVG(config: SVGExportConfig): Promise<string> {
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
    exportQuality = 8
  } = config;

  const boardPx = SVG_BOARD_PX;
  const squarePx = boardPx / 8;
  const withCoords = !!showCoords;
  
  const borderPx = withCoords
    ? Math.round(Math.max(18, Math.min(800, boardPx * SVG_COORD_BORDER_RATIO)))
    : 0;
    
  const withBorder = withCoords && (showCoordinateBorder || shouldForceCoordinateBorder(exportQuality));
  const withFrame = !!showThinFrame && (exportQuality === 8 || exportQuality === 16);
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
  await Promise.all(Object.values(pieceImages).map((img) => waitForPieceImage(img)));
  
  await Promise.all(
    Object.entries(pieceImages).map(async ([key, img]) => {
      if (img && img.complete && img.naturalWidth > 0) {
        pieceDataURLs[key] = await imageToEmbeddableDataURL(img);
      }
    })
  );

  const fontSize = Math.round(Math.max(10, Math.min(480, borderPx * 0.72)));
  const fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif";
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

  const borderStroke = Math.max(1, Math.round(boardPx * 0.002));
  parts.push(
    `<rect x="${boardX}" y="${boardY}" width="${boardPx}" height="${boardPx}" ` +
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
        `<image href="${dataURL}" x="${x}" y="${y}" ` +
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
 * Generates an SVG and triggers a download.
 * 
 * @param config - The export configuration
 * @param fileName - Target filename
 * @param onProgress - Progress callback function
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
    if (onProgress) onProgress(5, 'Preparing');
    const svgString = await generateBoardSVG(config);
    if (onProgress) onProgress(80, 'SVG ready');
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName}.svg`;
    document.body.appendChild(link);
    link.click();
    if (onProgress) onProgress(100, 'Done');
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    throw new Error(`SVG export failed: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
  }
}
