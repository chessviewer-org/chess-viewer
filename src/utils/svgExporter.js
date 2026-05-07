import { parseFEN } from './fenParser';
import { shouldForceCoordinateBorder } from './imageOptimizer';
import { logger } from './logger';
import { sanitizeFileName, sanitizeInput } from './validation';

const SVG_BOARD_PX = 800;
const SVG_COORD_BORDER_RATIO = 0.05;

/**
 * @param {string} fenPiece - FEN piece character
 * @returns {string|null} Image key (e.g. 'wK') or null if empty
 */
function getPieceKey(fenPiece) {
  if (!fenPiece) return null;
  const isWhite = fenPiece === fenPiece.toUpperCase();
  return (isWhite ? 'w' : 'b') + fenPiece.toUpperCase();
}

/**
 * Converts an image element to a base64 PNG data URL.
 * Redrawing on canvas effectively "sanitizes" the image data by
 * flattening any potential SVG-based vectors or scripts into pixels.
 *
 * @param {HTMLImageElement} img
 * @returns {Promise<string>}
 */
async function imageToDataURL(img) {
  return new Promise((resolve) => {
    try {
      const size = Math.max(img.naturalWidth || 64, img.naturalHeight || 64, 1);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    } catch (err) {
      logger.warn('SVG export: failed to convert piece image to base64:', err);
      resolve('');
    }
  });
}

/**
 * Generates an SVG string representing the full chess board with pieces.
 *
 * @param {Object} config - Board configuration
 * @param {number} config.boardSize - Board size in centimetres
 * @param {boolean} config.showCoords - Whether to draw coordinate labels
 * @param {string} config.lightSquare - Light square hex color
 * @param {string} config.darkSquare - Dark square hex color
 * @param {boolean} config.flipped - Whether to flip the board
 * @param {string} config.fen - FEN string
 * @param {Object} config.pieceImages - Loaded piece image map
 * @returns {Promise<string>} SVG markup string
 */
export async function generateBoardSVG(config) {
  const {
    lightSquare,
    darkSquare,
    flipped,
    fen,
    pieceImages,
    showCoords,
    showCoordinateBorder,
    showThinFrame,
    exportQuality
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
  const withFrame =
    !!showThinFrame && (exportQuality === 8 || exportQuality === 16);
  const framePx = withFrame ? Math.max(2, Math.round(boardPx * 0.003)) * 2 : 0;
  const totalWidth = borderPx + boardPx + framePx;
  const totalHeight = boardPx + borderPx + framePx;
  const boardX = borderPx + (withFrame ? framePx / 2 : 0);
  const boardY = withFrame ? framePx / 2 : 0;
  const board = parseFEN(fen);
  if (!board || board.length !== 8) {
    throw new Error('Invalid FEN: unable to parse board');
  }
  const pieceDataURLs = {};
  await Promise.all(
    Object.entries(pieceImages).map(async ([key, img]) => {
      if (img && img.complete && img.naturalWidth > 0) {
        pieceDataURLs[key] = await imageToDataURL(img);
      }
    })
  );
  const fontSize = Math.round(Math.max(10, Math.min(480, borderPx * 0.72)));
  const fontFamily = "system-ui, -apple-system, 'Segoe UI', sans-serif";
  const coordTextColor = '#000000';
  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `viewBox="0 0 ${totalWidth} ${totalHeight}" ` +
      `width="${totalWidth}" height="${totalHeight}" ` +
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
 * @param {Object} config - Board configuration (see generateBoardSVG)
 * @param {string} fileName - Base file name (without extension)
 * @param {function(number):void} [onProgress] - Progress callback (0–100)
 * @returns {Promise<void>}
 */
export async function downloadSVG(config, fileName, onProgress) {
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
    const blob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFileName + '.svg';
    document.body.appendChild(link);
    link.click();
    if (onProgress) onProgress(100, 'Done');
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    throw new Error('SVG export failed: ' + err.message, {
      cause: err
    });
  }
}
