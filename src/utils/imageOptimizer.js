import { QUALITY_PRESETS } from '@/constants';

import { getCoordinateParams } from './coordinateCalculations';
import { logger } from './logger';

export const CM_PER_INCH = 2.54;
export const PRINT_DPI = 300;
export const CM_TO_PIXELS = PRINT_DPI / CM_PER_INCH;
/**
 * Converts centimetres to pixels at PRINT_DPI.
 *
 * @param {number} cm
 * @returns {number} Pixel count
 */
export function cmToPixels(cm) {
  return Math.round((cm / CM_PER_INCH) * PRINT_DPI);
}
/**
 * Converts pixels to centimetres at PRINT_DPI.
 *
 * @param {number} pixels
 * @returns {number}
 */
export function pixelsToCm(pixels) {
  return (pixels / PRINT_DPI) * CM_PER_INCH;
}

/**
 * Converts physical board size + quality multiplier into board pixels.
 *
 * Formula:
 *   pixels = (cm / 2.54) * baseDpi * multiplier
 *
 * @param {number} boardSizeCm
 * @param {number} qualityMultiplier
 * @param {number} [baseDpi=PRINT_DPI]
 * @returns {number}
 */
export function calculateBoardPixels(
  boardSizeCm,
  qualityMultiplier,
  baseDpi = PRINT_DPI
) {
  return Math.round((boardSizeCm / CM_PER_INCH) * baseDpi * qualityMultiplier);
}
let _cachedMaxCanvasSize = null;

/**
 * Returns the maximum canvas dimension supported by the current browser.
 *
 * @returns {number} Max canvas size in pixels
 */
export function getMaxCanvasSize() {
  if (_cachedMaxCanvasSize !== null) return _cachedMaxCanvasSize;
  try {
    const ua = navigator.userAgent;
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      _cachedMaxCanvasSize = 16384;
    } else {
      _cachedMaxCanvasSize = 32767;
    }
  } catch {
    _cachedMaxCanvasSize = 16384;
  }
  return _cachedMaxCanvasSize;
}
/**
 * Returns the export mode ('print' or 'social') for a given quality multiplier.
 *
 * @param {number} quality - Export quality value
 * @returns {string}
 */
export function getExportMode(quality) {
  for (let i = 0; i < QUALITY_PRESETS.length; i++) {
    if (QUALITY_PRESETS[i].value === quality) {
      return QUALITY_PRESETS[i].mode;
    }
  }
  return 'print';
}
/**
 * @param {number} quality
 * @returns {boolean} True if the quality preset forces a coordinate border
 */
export function shouldForceCoordinateBorder(quality) {
  for (let i = 0; i < QUALITY_PRESETS.length; i++) {
    if (QUALITY_PRESETS[i].value === quality) {
      return !!QUALITY_PRESETS[i].forceCoordinateBorder;
    }
  }
  return false;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return Math.round(bytes) + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}
/**
 * Calculates the final canvas dimensions for an export operation.
 *
 * @param {number} boardSizeCm - Physical board size in centimetres
 * @param {boolean} showCoords - Whether to include coordinate border
 * @param {number} exportQuality - Quality multiplier
 * @returns {Object} Export size details including width, height, borderSize, mode, etc.
 */
export function calculateExportSize(boardSizeCm, showCoords, exportQuality) {
  const safeQuality =
    Number.isFinite(exportQuality) && exportQuality > 0 ? exportQuality : 1;
  const mode = getExportMode(safeQuality);
  const maxCanvasSize = getMaxCanvasSize();
  const rawBoardPixels = calculateBoardPixels(boardSizeCm, safeQuality);
  const coordParams = getCoordinateParams(rawBoardPixels);
  const rawBorder = showCoords ? coordParams.borderSize : 0;
  const rawWidth = Math.round(rawBorder + rawBoardPixels);
  const rawHeight = Math.round(rawBoardPixels + rawBorder);
  let width = rawWidth;
  let height = rawHeight;
  let scaleFactor = 1.0;
  if (rawWidth > maxCanvasSize || rawHeight > maxCanvasSize) {
    const maxDim = Math.max(rawWidth, rawHeight);
    scaleFactor = maxCanvasSize / maxDim;
    width = Math.round(rawWidth * scaleFactor);
    height = Math.round(rawHeight * scaleFactor);
    logger.warn(
      'Resolution reduced by ' +
        (scaleFactor * 100).toFixed(1) +
        '% for browser compatibility'
    );
  }
  return {
    width,
    height,
    scaleFactor,
    boardPixels: Math.round(rawBoardPixels * scaleFactor),
    baseBoardPixels: rawBoardPixels,
    baseWidth: rawWidth,
    baseHeight: rawHeight,
    borderSize: Math.round(rawBorder * scaleFactor),
    physicalSizeCm: boardSizeCm,
    effectiveDPI: Math.round(PRINT_DPI * safeQuality * scaleFactor),
    mode,
    exportQuality: safeQuality
  };
}

/**
 * Calculates the final raster surface dimensions including optional frame.
 *
 * @param {number} boardSizeCm
 * @param {boolean} showCoords
 * @param {number} exportQuality
 * @param {boolean} [showThinFrame=false]
 * @returns {{
 *   boardPixels: number,
 *   borderSize: number,
 *   shouldShowFrame: boolean,
 *   frameThickness: number,
 *   framePadding: number,
 *   canvasWidth: number,
 *   canvasHeight: number,
 *   physicalWidthCm: number,
 *   physicalHeightCm: number,
 *   physicalBoardSizeCm: number,
 *   effectiveDPI: number,
 *   scaleFactor: number
 * }}
 */
export function calculateRenderSurfaceSize(
  boardSizeCm,
  showCoords,
  exportQuality,
  showThinFrame = false
) {
  const exportSize = calculateExportSize(
    boardSizeCm,
    showCoords,
    exportQuality
  );
  const borderSize = showCoords ? exportSize.borderSize : 0;
  const shouldShowFrame =
    !!showThinFrame &&
    (exportSize.exportQuality === 8 || exportSize.exportQuality === 16);
  const frameThickness = shouldShowFrame
    ? Math.max(2, Math.round(exportSize.boardPixels * 0.003))
    : 0;
  const framePadding = shouldShowFrame ? frameThickness * 2 : 0;
  const canvasWidth = Math.round(
    borderSize + exportSize.boardPixels + framePadding
  );
  const canvasHeight = Math.round(
    exportSize.boardPixels + borderSize + framePadding
  );
  const physicalWidthCm = (canvasWidth / exportSize.effectiveDPI) * CM_PER_INCH;
  const physicalHeightCm =
    (canvasHeight / exportSize.effectiveDPI) * CM_PER_INCH;
  return {
    boardPixels: exportSize.boardPixels,
    borderSize,
    shouldShowFrame,
    frameThickness,
    framePadding,
    canvasWidth,
    canvasHeight,
    physicalWidthCm,
    physicalHeightCm,
    physicalBoardSizeCm: boardSizeCm,
    effectiveDPI: exportSize.effectiveDPI,
    scaleFactor: exportSize.scaleFactor
  };
}

/**
 * Returns the effective scale factor after applying quality constraints.
 *
 * @param {number} boardSizeCm
 * @param {boolean} showCoords
 * @param {number} [requestedQuality]
 * @returns {number} Scale factor (1.0 = no reduction)
 */
export function calculateOptimalQuality(
  boardSizeCm,
  showCoords,
  requestedQuality
) {
  const quality = requestedQuality ?? 1;
  const exportSize = calculateExportSize(boardSizeCm, showCoords, quality);
  return exportSize.scaleFactor;
}
/**
 * Estimates PNG and JPEG file sizes for given canvas dimensions.
 *
 * @param {number} width
 * @param {number} height
 * @param {number} exportQuality
 * @returns {{ png: string, jpeg: string, pngBytes: number, jpegBytes: number }}
 */
export function estimateFileSizes(width, height, exportQuality) {
  const pixels = width * height;
  const mode = getExportMode(exportQuality);
  // Chessboards compress very well because of large flat colored areas
  const pngFactor = mode === 'print' ? 0.05 : 0.08;
  const jpegFactor = mode === 'print' ? 0.04 : 0.06;
  const pngBytes = Math.round(pixels * pngFactor);
  const jpegBytes = Math.round(pixels * jpegFactor);
  return {
    png: formatFileSize(pngBytes),
    jpeg: formatFileSize(jpegBytes),
    pngBytes,
    jpegBytes
  };
}
