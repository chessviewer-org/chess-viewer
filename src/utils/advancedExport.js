import { createUltraQualityCanvas } from './';
import { calculateRenderSurfaceSize } from './imageOptimizer';
import { logger } from './logger';

/**
 * Exports the board progressively, choosing chunked or standard strategy based on canvas size.
 *
 * @param {Object} config - Board render + export configuration
 * @param {string} fileName - Base file name (without extension)
 * @param {string} format - Export format ('png' or 'jpeg')
 * @returns {Promise<void>}
 */
export async function progressiveExport(config, fileName, format) {
  const outputFormat = format ?? 'png';
  const canvas = await createSmartCanvas(config);
  if (canvas.width > 8192 || canvas.height > 8192) {
    return await chunkedExport(canvas, fileName, outputFormat);
  }
  return await standardExport(canvas, fileName, outputFormat);
}

async function createSmartCanvas(config) {
  const maxSafeSize = 16384;
  const adjustedConfig = { ...config };
  const { boardSize, showCoords, exportQuality, showThinFrame } = config;
  const projectedSurface = calculateRenderSurfaceSize(
    boardSize,
    !!showCoords,
    exportQuality,
    !!showThinFrame
  );
  const maxProjectedSide = Math.max(
    projectedSurface.canvasWidth,
    projectedSurface.canvasHeight
  );
  if (maxProjectedSide > maxSafeSize) {
    const baseSurface = calculateRenderSurfaceSize(
      boardSize,
      !!showCoords,
      1,
      !!showThinFrame
    );
    const maxBaseSide = Math.max(
      baseSurface.canvasWidth,
      baseSurface.canvasHeight
    );
    const safeQuality = Math.floor(maxSafeSize / Math.max(1, maxBaseSide));
    if (safeQuality < 8) {
      adjustedConfig.exportQuality = 8;
    } else {
      adjustedConfig.exportQuality = safeQuality;
    }
    logger.warn(
      'Quality adjusted to ' + adjustedConfig.exportQuality + 'x for stability'
    );
  }
  return await createUltraQualityCanvas(adjustedConfig);
}
async function chunkedExport(canvas, fileName, format) {
  logger.warn('Image too large, scaling down...');
  const scale = 0.5;
  const smallerCanvas = document.createElement('canvas');
  smallerCanvas.width = canvas.width * scale;
  smallerCanvas.height = canvas.height * scale;
  const ctx = smallerCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create 2D context for chunked export');
  }
  ctx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
  return await standardExport(smallerCanvas, fileName, format);
}
async function standardExport(canvas, fileName, format) {
  let mimeType = 'image/png';
  let extension = 'png';
  let quality = 1.0;
  if (format === 'jpeg') {
    mimeType = 'image/jpeg';
    extension = 'jpg';
    quality = 0.98;
  }
  return new Promise(function (resolve, reject) {
    canvas.toBlob(
      function (blob) {
        if (!blob) {
          reject(new Error('Failed to create ' + format + ' blob'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName + '.' + extension;
        document.body.appendChild(link);
        link.click();
        setTimeout(function () {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        }, 100);
      },
      mimeType,
      quality
    );
  });
}
