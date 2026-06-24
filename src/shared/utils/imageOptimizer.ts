import { QUALITY_PRESETS } from '@constants';

import { getCoordinateParams } from './coordinateCalculations';
import { logger } from './logger';

const CM_PER_INCH = 2.54;
const PRINT_DPI = 300;

/**
 * Converts physical board size + quality multiplier into board pixels.
 *
 * Formula: pixels = (cm / 2.54) * baseDpi * multiplier
 *
 * @param boardSizeCm - Physical board size in centimetres
 * @param qualityMultiplier - The export quality multiplier
 * @param baseDpi - The base dots per inch (default 300)
 * @returns Calculated board pixels
 */
function calculateBoardPixels(
  boardSizeCm: number,
  qualityMultiplier: number,
  baseDpi = PRINT_DPI
): number {
  return Math.round((boardSizeCm / CM_PER_INCH) * baseDpi * qualityMultiplier);
}

let _cachedMaxCanvasSize: number | null = null;

/**
 * Returns the maximum canvas dimension supported by the current browser.
 *
 * @returns Max canvas size in pixels
 */
export function getMaxCanvasSize(): number {
  if (_cachedMaxCanvasSize !== null) return _cachedMaxCanvasSize;
  try {
    const ua = navigator.userAgent;
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
      _cachedMaxCanvasSize = 16384;
    } else {
      const viewportWidth =
        typeof window !== 'undefined' ? window.innerWidth : Infinity;
      const dpr =
        typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1;
      const isMobileDevice = viewportWidth <= 768 && dpr >= 2;
      _cachedMaxCanvasSize = isMobileDevice ? 8192 : 32767;
    }
  } catch {
    _cachedMaxCanvasSize = 16384;
  }
  return _cachedMaxCanvasSize;
}

/**
 * Returns the export mode ('print' or 'social') for a given quality multiplier.
 *
 * @param quality - Export quality value
 * @returns The export mode string
 */
export function getExportMode(quality: number): string {
  for (let i = 0; i < QUALITY_PRESETS.length; i++) {
    const preset = QUALITY_PRESETS[i];
    if (preset && preset.value === quality) {
      return preset.mode;
    }
  }
  return 'print';
}

/**
 * Checks if the quality preset forces a coordinate border.
 *
 * @param quality - The quality multiplier
 * @returns True if the coordinate border should be forced
 */
export function shouldForceCoordinateBorder(quality: number): boolean {
  for (let i = 0; i < QUALITY_PRESETS.length; i++) {
    const preset = QUALITY_PRESETS[i];
    if (preset && preset.value === quality) {
      return !!preset.forceCoordinateBorder;
    }
  }
  return false;
}

/**
 * Formats a byte count into a human-readable string.
 *
 * @param bytes - The byte count
 * @returns Formatted size string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return Math.round(bytes) + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

/**
 * Calculates the final canvas dimensions for an export operation.
 *
 * @param boardSizeCm - Physical board size in centimetres
 * @param showCoords - Whether to include coordinate border
 * @param exportQuality - Quality multiplier
 * @returns Export size details including width, height, scaleFactor, etc.
 */
function calculateExportSize(
  boardSizeCm: number,
  showCoords: boolean,
  exportQuality: number
) {
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

export interface RenderSurfaceSize {
  boardPixels: number;
  borderSize: number;
  shouldShowFrame: boolean;
  frameThickness: number;
  framePadding: number;
  canvasWidth: number;
  canvasHeight: number;
  physicalWidthCm: number;
  physicalHeightCm: number;
  physicalBoardSizeCm: number;
  effectiveDPI: number;
  scaleFactor: number;
}

/**
 * Calculates the final raster surface dimensions including optional frame.
 *
 * @param boardSizeCm - Physical board size in centimetres
 * @param showCoords - Whether to include coordinate labels
 * @param exportQuality - Export quality multiplier
 * @param showThinFrame - Whether to include a thin outer frame
 * @returns Object with detailed surface measurements
 */
export function calculateRenderSurfaceSize(
  boardSizeCm: number,
  showCoords: boolean,
  exportQuality: number,
  showThinFrame = false
): RenderSurfaceSize {
  const exportSize = calculateExportSize(
    boardSizeCm,
    showCoords,
    exportQuality
  );
  const borderSize = showCoords ? exportSize.borderSize : 0;
  const shouldShowFrame = !!showThinFrame;
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

export interface FileSizeEstimates {
  png: string;
  jpeg: string;
  pngBytes: number;
  jpegBytes: number;
}

/**
 * Estimates PNG and JPEG file sizes for given canvas dimensions.
 *
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @param exportQuality - The quality multiplier
 * @returns Object containing formatted and raw byte estimates
 */
export function estimateFileSizes(
  width: number,
  height: number,
  exportQuality: number
): FileSizeEstimates {
  const pixels = width * height;
  const mode = getExportMode(exportQuality);
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
