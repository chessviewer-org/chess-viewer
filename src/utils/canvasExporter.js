import {
  calculateExportSize,
  createUltraQualityCanvas,
  estimateFileSizes,
  getExportMode,
  getMaxCanvasSize,
  sanitizeFileName,
  shouldForceCoordinateBorder
} from './';

let exportState = {
  cancelled: false,
  paused: false
};
/** Cancels any in-progress export operation. */
export function cancelExport() {
  exportState.cancelled = true;
  exportState.paused = false;
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
}
/**
 * Waits asynchronously while the export is paused.
 *
 * @returns {Promise<void>}
 */
async function waitWhilePaused() {
  while (exportState.paused && !exportState.cancelled) {
    await new Promise(function (resolve) {
      setTimeout(resolve, 100);
    });
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
 * @param {function(number, string):void} [onProgress]
 * @param {number} value
 * @param {string} label
 */
function setProgress(onProgress, value, label) {
  if (onProgress) {
    onProgress(value, label);
  }
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
 * @param {Object} config - Export configuration
 * @param {number} config.boardSize - Board size in centimetres
 * @param {boolean} config.showCoords - Whether coordinates are shown
 * @param {number} config.exportQuality - Quality multiplier
 * @returns {Object} Export metadata
 */
export function getExportInfo(config) {
  const boardSize = config.boardSize;
  const showCoords = config.showCoords;
  const exportQuality = config.exportQuality;
  const exportSize = calculateExportSize(boardSize, showCoords, exportQuality);
  const maxSize = getMaxCanvasSize();
  const mode = getExportMode(exportQuality);
  const fileSizes = estimateFileSizes(
    exportSize.width,
    exportSize.height,
    exportQuality
  );
  return {
    displaySize: exportSize.width + ' × ' + exportSize.height,
    exportWidth: exportSize.width,
    exportHeight: exportSize.height,
    requestedQuality: exportQuality,
    actualQuality: exportSize.scaleFactor,
    maxCanvasSize: maxSize,
    willBeReduced: exportSize.scaleFactor < 1,
    memoryEstimateMB: estimateMemoryMB(exportSize.width, exportSize.height),
    isLargeExport: estimateMemoryMB(exportSize.width, exportSize.height) > 512,
    fileSizeEstimate: fileSizes,
    mode: mode,
    physicalSizeCm: exportSize.physicalSizeCm,
    effectiveDPI: exportSize.effectiveDPI,
    forceCoordinateBorder: shouldForceCoordinateBorder(exportQuality)
  };
}

/**
 * Validates the export configuration object.
 *
 * @param {Object} config
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
 * Renders the board and triggers a PNG download.
 *
 * @param {Object} config - Board render + export configuration
 * @param {string} fileName - Base file name (without extension)
 * @param {function(number):void} [onProgress] - Progress callback (0–100)
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
    const pngConfig = Object.assign({}, config, {
      format: 'png'
    });
    const canvas = await createUltraQualityCanvas(pngConfig);
    if (!canvas) {
      throw new Error('Canvas creation returned null');
    }
    setProgress(onProgress, 45, 'Canvas ready');
    await waitWhilePaused();
    checkCancellation();
    const blob = await new Promise(function (resolve, reject) {
      try {
        canvas.toBlob(
          function (blob) {
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
          'image/png',
          1.0
        );
      } catch (err) {
        reject(err);
      }
    });
    setProgress(onProgress, 85, 'Image encoded');
    await waitWhilePaused();
    checkCancellation();
    const url = URL.createObjectURL(blob);
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
    if (error.message === 'Export cancelled') {
      throw new Error('Export cancelled', {
        cause: error
      });
    }
    throw new Error('PNG export failed: ' + error.message, {
      cause: error
    });
  } finally {
    resetExportState();
  }
}
/**
 * Renders the board and triggers a JPEG download.
 *
 * @param {Object} config - Board render + export configuration
 * @param {string} fileName - Base file name (without extension)
 * @param {function(number):void} [onProgress] - Progress callback (0–100)
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
    const jpegConfig = Object.assign({}, config, {
      format: 'jpeg'
    });
    const canvas = await createUltraQualityCanvas(jpegConfig);
    if (!canvas) {
      throw new Error('Canvas creation returned null');
    }
    setProgress(onProgress, 35, 'Canvas ready');
    await waitWhilePaused();
    checkCancellation();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d', {
      alpha: false,
      desynchronized: false,
      willReadFrequently: false
    });
    if (!ctx) {
      throw new Error('Failed to get 2D context for JPEG conversion');
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0);
    setProgress(onProgress, 60, 'JPEG background ready');
    await waitWhilePaused();
    checkCancellation();
    const jpegQuality = 0.92;
    const blob = await new Promise(function (resolve, reject) {
      try {
        tempCanvas.toBlob(
          function (blob) {
            if (exportState.cancelled) {
              reject(new Error('Export cancelled'));
              return;
            }
            if (!blob) {
              reject(
                new Error(
                  'Canvas.toBlob returned null - browser may not support JPEG export'
                )
              );
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          jpegQuality
        );
      } catch (err) {
        reject(err);
      }
    });
    setProgress(onProgress, 85, 'Image encoded');
    await waitWhilePaused();
    checkCancellation();
    const url = URL.createObjectURL(blob);
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
      tempCanvas.width = 0;
      tempCanvas.height = 0;
    }, 100);
  } catch (error) {
    if (error.message === 'Export cancelled') {
      throw new Error('Export cancelled', {
        cause: error
      });
    }
    throw new Error('JPEG export failed: ' + error.message, {
      cause: error
    });
  } finally {
    resetExportState();
  }
}
/**
 * Renders the board and copies a PNG to the system clipboard.
 *
 * @param {Object} config - Board render + export configuration
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
    if (error.message === 'Export cancelled') {
      throw new Error('Export cancelled', {
        cause: error
      });
    }
    throw new Error('Copy failed: ' + error.message, {
      cause: error
    });
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
 * @param {Object} config - Board render + export configuration
 * @param {string[]} formats - Array of format strings ('png', 'jpeg', 'svg')
 * @param {string} fileName - Base file name (without extension)
 * @param {function(number):void} [onProgress] - Aggregate progress callback (0–100)
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
        if (onProgress) {
          onProgress(totalProgress, format);
        }
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
      if (error.message === 'Export cancelled') {
        throw error;
      }
      results.failed.push({
        format: format,
        error: error.message
      });
    }
  }
  if (onProgress) {
    onProgress(100, null);
  }
  if (results.failed.length > 0) {
    const failedNames = [];
    for (let i = 0; i < results.failed.length; i++) {
      failedNames.push(results.failed[i].format);
    }
    throw new Error('Some exports failed: ' + failedNames.join(', '));
  }
  return results;
}
