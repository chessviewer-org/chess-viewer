import { ExportConfig, ExportInfo, ProgressCallback } from './canvasExporter';
import {
  calculateRenderSurfaceSize,
  estimateFileSizes,
  getExportMode,
  getMaxCanvasSize,
  shouldForceCoordinateBorder
} from './imageOptimizer';
import { isValidHexColor, MAX_FEN_LENGTH } from '@chessviewer-org/chess-viewer';
import { isSvgRasterWorkerSupported } from './workerRasterExport';

// Types
export interface ExportState {
  cancelled: boolean;
  paused: boolean;
}

// State
export let exportState: ExportState = {
  cancelled: false,
  paused: false
};

let activeRasterTaskCancel: (() => void) | null = null;

// Actions
export function setActiveRasterTask(cancel: () => void) {
  activeRasterTaskCancel = cancel;
}

export function clearActiveRasterTask() {
  activeRasterTaskCancel = null;
}

export function cancelExport() {
  exportState.cancelled = true;
  exportState.paused = false;
  if (activeRasterTaskCancel) {
    activeRasterTaskCancel();
    clearActiveRasterTask();
  }
}

export function pauseExport() {
  exportState.paused = true;
}

export function resumeExport() {
  exportState.paused = false;
}

export function resetExportState() {
  exportState = {
    cancelled: false,
    paused: false
  };
  clearActiveRasterTask();
}

export async function waitWhilePaused(): Promise<void> {
  while (exportState.paused && !exportState.cancelled) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

export function checkCancellation() {
  if (exportState.cancelled) {
    throw new Error('Export cancelled');
  }
}

export function setProgress(
  onProgress: ProgressCallback | undefined,
  value: number,
  label: string | null
) {
  onProgress?.(value, label);
}

function estimateMemoryMB(width: number, height: number): number {
  return Math.round((width * height * 4) / 1024 / 1024);
}

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
    exportSize.canvasHeight
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
    } else if (config.fen.length > MAX_FEN_LENGTH) {
      errors.push(`FEN exceeds maximum length of ${MAX_FEN_LENGTH} characters`);
    }
    if (!config.lightSquare || !config.darkSquare) {
      errors.push('Square colors are missing');
    } else {
      if (!isValidHexColor(config.lightSquare)) {
        errors.push('lightSquare is not a valid hex color');
      }
      if (!isValidHexColor(config.darkSquare)) {
        errors.push('darkSquare is not a valid hex color');
      }
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
    throw new Error(`Invalid board state or settings: ${errors.join(', ')}`);
  }
}
