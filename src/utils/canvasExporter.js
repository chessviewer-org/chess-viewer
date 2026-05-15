import { createUltraQualityCanvas } from './canvasRenderer';
import { changeDPI } from './dpiEncoder';
import {
  calculateRenderSurfaceSize,
  estimateFileSizes,
  getExportMode,
  getMaxCanvasSize,
  shouldForceCoordinateBorder
} from './imageOptimizer';
import { logger } from './logger';
import { generateBoardSVG } from './svgExporter';
import {
  isSvgRasterWorkerSupported,
  startSvgRasterWorkerTask
} from './workerRasterExport';
import { sanitizeFileName } from './validation';

/**
 * @typedef {(progress: number, label?: string | null) => void} ProgressCallback
 */

/**
 * @typedef {Object} ExportConfig
 * @property {number} boardSize
 * @property {boolean} showCoords
 * @property {number} exportQuality
 * @property {boolean} [showThinFrame]
 * @property {string} fen
 * @property {string} lightSquare
 * @property {string} darkSquare
 * @property {Record<string, HTMLImageElement>} pieceImages
 */

let exportState = {
  cancelled: false,
  paused: false
};
let activeRasterTaskCancel = null;

function clearActiveRasterTask() {
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
 *
 * @returns {Promise<void>}
 */
async function waitWhilePaused() {
  while (exportState.paused && !exportState.cancelled) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Checks if the export was cancelled and throws an error if so.
 */
function checkCancellation() {
  if (exportState.cancelled) {
    throw new Error('Export cancelled');
  }
}

/**
 * Sets the progress callback if it exists.
 *
 * @param {ProgressCallback} [onProgress]
 * @param {number} value
 * @param {string | null} label
 */
function setProgress(onProgress, value, label) {
  onProgress?.(value, label);
}

/**
 * Estimates the memory required in MB for a given width and height.
 *
 * @param {number} width
 * @param {number} height
 * @returns {number}
 */
function estimateMemoryMB(width, height) {
  return Math.round((width * height * 4) / 1024 / 1024);
}
/**
 * Returns metadata about the planned export (dimensions, DPI, file size estimate).
 *
 * @param {ExportConfig} config - Export configuration
 * @returns {Object} Export metadata
 */
export function getExportInfo(config) {
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
    displaySize: exportSize.canvasWidth + ' × ' + exportSize.canvasHeight,
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
    fileSizeEstimate: fileSizes,
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
 *
 * @param {ExportConfig} config
 */
function validateExportConfig(config) {
  const errors = [];
  if (!config) {
    errors.push('Config is null or undefined');
  } else {
    if (!config.boardSize || config.boardSize < 1) {
      errors.push(
        'Invalid boardSize: ' + config.boardSize + 'cm (minimum 1cm)'
      );
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
      errors.push('pieceImages is not an object: ' + typeof config.pieceImages);
    } else if (Object.keys(config.pieceImages).length === 0) {
      errors.push('pieceImages is empty');
    }
  }
  if (errors.length > 0) {
    throw new Error('Invalid export config: ' + errors.join(', '));
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} mimeType
 * @param {number} quality
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (exportState.cancelled) {
            reject(new Error('Export cancelled'));
            return;
          }
          if (!blob) {
            reject(
              new Error(
                'Canvas.toBlob returned null - browser may not support this feature'
              )
            );
            return;
          }
          resolve(blob);
        },
        mimeType,
        quality
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * @param {ExportConfig} config
 * @param {'png'|'jpeg'} format
 * @param {ProgressCallback} [onProgress]
 * @returns {Promise<Blob>}
 */
async function createCanvasRasterBlob(config, format, onProgress) {
  const canvasConfig = {
    ...config,
    format
  };
  const canvas = await createUltraQualityCanvas(canvasConfig);
  if (!canvas) {
    throw new Error('Canvas creation returned null');
  }
  setProgress(onProgress, 45, 'Canvas ready');
  await waitWhilePaused();
  checkCancellation();

  if (format === 'png') {
    return canvasToBlob(canvas, 'image/png', 1.0);
  }

  const jpegCanvas = document.createElement('canvas');
  jpegCanvas.width = canvas.width;
  jpegCanvas.height = canvas.height;
  const ctx = jpegCanvas.getContext('2d', {
    alpha: false,
    desynchronized: false,
    willReadFrequently: false
  });
  if (!ctx) {
    throw new Error('Failed to get 2D context for JPEG conversion');
  }
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0);
  setProgress(onProgress, 60, 'JPEG background ready');
  await waitWhilePaused();
  checkCancellation();
  return canvasToBlob(jpegCanvas, 'image/jpeg', 0.92);
}

/**
 * @param {ExportConfig} config
 * @param {'png'|'jpeg'} format
 * @param {ProgressCallback} [onProgress]
 * @returns {Promise<Blob>}
 */
async function createWorkerRasterBlob(config, format, onProgress) {
  if (!isSvgRasterWorkerSupported()) {
    return null;
  }
  const {
    boardSize,
    showCoords,
    exportQuality,
    showThinFrame = false
  } = config;

  setProgress(onProgress, 20, 'Building SVG');
  const svgString = await generateBoardSVG(config);
  await waitWhilePaused();
  checkCancellation();

  const surface = calculateRenderSurfaceSize(
    boardSize,
    showCoords,
    exportQuality,
    showThinFrame
  );
  const task = startSvgRasterWorkerTask({
    svgString,
    width: surface.canvasWidth,
    height: surface.canvasHeight,
    format,
    quality: 0.92,
    onProgress: (progress, label) => {
      const mappedProgress = Math.max(
        45,
        Math.min(80, 45 + Math.round((progress / 100) * 35))
      );
      setProgress(onProgress, mappedProgress, label ?? 'Rendering');
    }
  });
  if (!task) {
    return null;
  }
  activeRasterTaskCancel = task.cancel;
  try {
    return await task.promise;
  } finally {
    clearActiveRasterTask();
  }
}

/**
 * @param {ExportConfig} config
 * @param {'png'|'jpeg'} format
 * @param {ProgressCallback} [onProgress]
 * @returns {Promise<Blob>}
 */
async function createRasterBlob(config, format, onProgress) {
  try {
    const workerBlob = await createWorkerRasterBlob(config, format, onProgress);
    if (workerBlob) {
      return workerBlob;
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Export cancelled') {
      throw error;
    }
    logger.warn(
      'Worker raster export failed. Falling back to main-thread canvas:',
      error
    );
  }
  return createCanvasRasterBlob(config, format, onProgress);
}
/**
 * Renders the board and triggers a PNG download.
 *
 * @param {ExportConfig} config - Board render + export configuration
 * @param {string} fileName - Base file name (without extension)
 * @param {ProgressCallback} [onProgress] - Progress callback (0–100)
 * @returns {Promise<void>}
 */
export async function downloadPNG(config, fileName, onProgress) {
  resetExportState();
  try {
    validateExportConfig(config);
    const safeFileName = sanitizeFileName(fileName);
    setProgress(onProgress, 5, 'Preparing');
    await waitWhilePaused();
    checkCancellation();
    const blob = await createRasterBlob(config, 'png', onProgress);
    setProgress(onProgress, 85, 'Image encoded');
    await waitWhilePaused();
    checkCancellation();

    const exportInfo = getExportInfo(config);
    const finalBlob = await changeDPI(blob, exportInfo.effectiveDPI, 'png');

    const url = URL.createObjectURL(finalBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFileName + '.png';
    document.body.appendChild(link);
    link.click();
    setProgress(onProgress, 100, 'Done');
    setTimeout(function () {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    if (error instanceof Error && error.message === 'Export cancelled') {
      throw new Error('Export cancelled', {
        cause: error
      });
    }
    throw new Error(
      'PNG export failed: ' +
        (error instanceof Error ? error.message : String(error)),
      {
        cause: error instanceof Error ? error : undefined
      }
    );
  } finally {
    resetExportState();
  }
}
/**
 * Renders the board and triggers a JPEG download.
 *
 * @param {ExportConfig} config - Board render + export configuration
 * @param {string} fileName - Base file name (without extension)
 * @param {ProgressCallback} [onProgress] - Progress callback (0–100)
 * @returns {Promise<void>}
 */
export async function downloadJPEG(config, fileName, onProgress) {
  resetExportState();
  try {
    validateExportConfig(config);
    const safeFileName = sanitizeFileName(fileName);
    setProgress(onProgress, 5, 'Preparing');
    await waitWhilePaused();
    checkCancellation();
    const blob = await createRasterBlob(config, 'jpeg', onProgress);
    setProgress(onProgress, 85, 'Image encoded');
    await waitWhilePaused();
    checkCancellation();

    const exportInfo = getExportInfo(config);
    const finalBlob = await changeDPI(blob, exportInfo.effectiveDPI, 'jpeg');

    const url = URL.createObjectURL(finalBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFileName + '.jpg';
    document.body.appendChild(link);
    link.click();
    setProgress(onProgress, 100, 'Done');
    setTimeout(function () {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    if (error instanceof Error && error.message === 'Export cancelled') {
      throw new Error('Export cancelled', {
        cause: error
      });
    }
    throw new Error(
      'JPEG export failed: ' +
        (error instanceof Error ? error.message : String(error)),
      {
        cause: error instanceof Error ? error : undefined
      }
    );
  } finally {
    resetExportState();
  }
}

/**
 * Renders the board and copies a PNG to the system clipboard.
 *
 * @param {ExportConfig} config - Board render + export configuration
 * @returns {Promise<void>}
 */
export async function copyToClipboard(config) {
  resetExportState();
  let canvas = null;
  try {
    validateExportConfig(config);
    canvas = await createUltraQualityCanvas(config);
    if (!canvas) {
      throw new Error('Canvas creation returned null');
    }
    checkCancellation();
    const blob = await new Promise(function (resolve, reject) {
      canvas.toBlob(
        function (blob) {
          if (exportState.cancelled) {
            reject(new Error('Export cancelled'));
            return;
          }
          if (!blob) {
            reject(new Error('Failed to create blob for clipboard'));
          } else {
            resolve(blob);
          }
        },
        'image/png',
        1.0
      );
    });
    checkCancellation();
    const clipboardItem = new ClipboardItem({
      'image/png': blob
    });
    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === 'Export cancelled') {
      throw new Error('Export cancelled', {
        cause: error
      });
    }
    throw new Error(
      'Copy failed: ' +
        (error instanceof Error ? error.message : String(error)),
      {
        cause: error instanceof Error ? error : undefined
      }
    );
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    resetExportState();
  }
}
/**
 * Exports the board in multiple formats sequentially.
 *
 * @param {ExportConfig} config - Board render + export configuration
 * @param {string[]} formats - Array of format strings ('png', 'jpeg', 'svg')
 * @param {string} fileName - Base file name (without extension)
 * @param {ProgressCallback} [onProgress] - Aggregate progress callback (0–100)
 * @returns {Promise<void>}
 */
export async function batchExport(config, formats, fileName, onProgress) {
  resetExportState();
  validateExportConfig(config);
  const total = formats.length;
  const results = {
    success: [],
    failed: []
  };
  for (let i = 0; i < total; i++) {
    if (exportState.cancelled) {
      throw new Error('Export cancelled');
    }
    const format = formats[i];
    const baseProgress = (i / total) * 100;
    try {
      function updateProgress(p) {
        const totalProgress = baseProgress + p / total;
        onProgress?.(totalProgress, format);
      }
      if (format === 'png') {
        await downloadPNG(config, fileName, updateProgress);
        results.success.push('PNG');
      } else if (format === 'jpeg') {
        await downloadJPEG(config, fileName, updateProgress);
        results.success.push('JPEG');
      } else if (format === 'svg') {
        const { downloadSVG } = await import('./svgExporter');
        await downloadSVG(config, fileName, updateProgress);
        results.success.push('SVG');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'Export cancelled') {
        throw error;
      }
      results.failed.push({
        format: format,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  onProgress?.(100, null);
  if (results.failed.length > 0) {
    const failedNames = [];
    for (let i = 0; i < results.failed.length; i++) {
      failedNames.push(results.failed[i].format);
    }
    throw new Error('Some exports failed: ' + failedNames.join(', '));
  }
  return results;
}
