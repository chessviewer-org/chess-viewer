import { QUALITY_PRESETS } from '@constants';

import { getCoordinateParams } from '@chessviewer-org/chess-viewer';
import { logger } from './logger';

// Constants
const CM_PER_INCH = 2.54;
const PRINT_DPI = 300;

// Helpers
function calculateBoardPixels(
  boardSizeCm: number,
  qualityMultiplier: number,
  baseDpi = PRINT_DPI
): number {
  return Math.round((boardSizeCm / CM_PER_INCH) * baseDpi * qualityMultiplier);
}

let _cachedMaxCanvasSize: number | null = null;

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

function findQualityPreset(quality: number) {
  return QUALITY_PRESETS.find((preset) => preset.value === quality);
}

export function getExportMode(quality: number): string {
  return findQualityPreset(quality)?.mode ?? 'print';
}

export function shouldForceCoordinateBorder(quality: number): boolean {
  return !!findQualityPreset(quality)?.forceCoordinateBorder;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return Math.round(bytes) + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

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

export function estimateFileSizes(
  width: number,
  height: number,
  _exportQuality: number
): FileSizeEstimates {
  const pixels = width * height;
  // A chess diagram is mostly flat colour, so bytes-per-pixel falls as the
  // image grows (larger flat runs compress better). Modelling the encoded
  // size as proportional to sqrt(pixels) tracks that far more closely than a
  // fixed bytes-per-pixel factor. Coefficients fitted against real PNG/JPEG
  // (q=0.92) exports of coordinate boards across export sizes.
  const scale = Math.sqrt(pixels);
  const pngBytes = Math.round(scale * 90);
  const jpegBytes = Math.round(scale * 55);
  return {
    png: formatFileSize(pngBytes),
    jpeg: formatFileSize(jpegBytes),
    pngBytes,
    jpegBytes
  };
}
