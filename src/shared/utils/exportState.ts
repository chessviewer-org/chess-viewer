import { ProgressCallback, ExportConfig, ExportInfo } from './canvasExporter';
import { calculateRenderSurfaceSize, getMaxCanvasSize, getExportMode, estimateFileSizes, shouldForceCoordinateBorder } from './imageOptimizer';
import { isSvgRasterWorkerSupported } from './workerRasterExport';

export interface ExportState {
  cancelled: boolean;
  paused: boolean;
}

export let exportState: ExportState = {
  cancelled: false,
  paused: false
};

export let activeRasterTaskCancel: (() => void) | null = null;

export function clearActiveRasterTask() {
  activeRasterTaskCancel = null;
}

/** Cancels any in-progress export operation. */
export function cancelExport() {
  exportState.cancelled = true;
  exportState.paused = false;
  if (activeRasterTaskCancel) {
    activeRasterTaskCancel();
    clearActiveRasterTask();
  }
}

/** Pauses the current export operation. */
export function pauseExport() {
  exportState.paused = true;
}

/** Resumes a paused export operation. */
export function resumeExport() {
  exportState.paused = false;
}

/** Resets export state (cancelled, paused) to defaults. */
export function resetExportState() {
  exportState = {
    cancelled: false,
    paused: false
  };
  clearActiveRasterTask();
}

/**
 * Waits asynchronously while the export is paused.
 */
export async function waitWhilePaused(): Promise<void> {
  while (exportState.paused && !exportState.cancelled) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Checks if the export was cancelled and throws an error if so.
 */
export function checkCancellation() {
  if (exportState.cancelled) {
    throw new Error('Export cancelled');
  }
}

/**
 * Sets the progress callback if it exists.
 */
export function setProgress(onProgress: ProgressCallback | undefined, value: number, label: string | null) {
  onProgress?.(value, label);
}

/**
 * Estimates the memory required in MB for a given width and height.
 */
export function estimateMemoryMB(width: number, height: number): number {
  return Math.round((width * height * 4) / 1024 / 1024);
}

/**
 * Returns metadata about the planned export (dimensions, DPI, file size estimate).
 *
 * @param config - Export configuration
 * @returns Export metadata
 */
export function getExportInfo(config: ExportConfig): ExportInfo {
  const {
    boardSize,
    showCoords,
    exportQuality,
    showThinFrame = false
  } = config;

  const exportSize = calculateRenderSurfaceSize(
    boardSize,
    showCoords,
    exportQuality,
    showThinFrame
  );

  const maxSize = getMaxCanvasSize();
  const mode = getExportMode(exportQuality);
  const fileSizes = estimateFileSizes(
    exportSize.canvasWidth,
    exportSize.canvasHeight,
    exportQuality
  );

  return {
    canvasWidth: exportSize.canvasWidth,
    canvasHeight: exportSize.canvasHeight,
    displaySize: `${exportSize.canvasWidth} × ${exportSize.canvasHeight}`,
    exportWidth: exportSize.canvasWidth,
    exportHeight: exportSize.canvasHeight,
    requestedQuality: exportQuality,
    actualQuality: exportSize.scaleFactor,
    maxCanvasSize: maxSize,
    willBeReduced: exportSize.scaleFactor < 1,
    memoryEstimateMB: estimateMemoryMB(
      exportSize.canvasWidth,
      exportSize.canvasHeight
    ),
    isLargeExport:
      estimateMemoryMB(exportSize.canvasWidth, exportSize.canvasHeight) > 512,
    fileSizeEstimates: fileSizes,
    mode: mode,
    physicalSizeCm: exportSize.physicalBoardSizeCm,
    physicalWidthCm: Number(exportSize.physicalWidthCm.toFixed(2)),
    physicalHeightCm: Number(exportSize.physicalHeightCm.toFixed(2)),
    effectiveDPI: exportSize.effectiveDPI,
    forceCoordinateBorder: shouldForceCoordinateBorder(exportQuality),
    renderEngine: isSvgRasterWorkerSupported()
      ? 'svg-worker-raster'
      : 'canvas-main-thread'
  };
}

/**
 * Validates the export configuration object.
 */
export function validateExportConfig(config: ExportConfig) {
  const errors: string[] = [];
  if (!config) {
    errors.push('Config is null or undefined');
  } else {
    if (!config.boardSize || config.boardSize < 1) {
      errors.push(`Invalid boardSize: ${config.boardSize}cm (minimum 1cm)`);
    }
    if (!config.fen) {
      errors.push('FEN is missing');
    }
    if (!config.lightSquare || !config.darkSquare) {
      errors.push('Square colors are missing');
    }
    if (!config.pieceImages) {
      errors.push('pieceImages is null or undefined');
    } else if (typeof config.pieceImages !== 'object') {
      errors.push(`pieceImages is not an object: ${typeof config.pieceImages}`);
    } else if (Object.keys(config.pieceImages).length === 0) {
      errors.push('pieceImages is empty');
    }
  }
  if (errors.length > 0) {
    throw new Error(`Invalid export config: ${errors.join(', ')}`);
  }
}
