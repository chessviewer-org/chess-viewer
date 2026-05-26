import { createUltraQualityCanvas } from './';
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
  if (format === undefined || format === null) {
    format = 'png';
  }
  const canvas = await createSmartCanvas(config);
  try {
    if (canvas.width > 8192 || canvas.height > 8192) {
      return await chunkedExport(canvas, fileName, format);
    }
    return await standardExport(canvas, fileName, format);
  } finally {
    releaseCanvas(canvas);
  }
}

async function createSmartCanvas(config) {
  const maxSafeSize = 16384;
  const adjustedConfig = Object.assign({}, config);
  const projectedSize = (config.boardSize + 60) * config.exportQuality;
  if (projectedSize > maxSafeSize) {
    const safeQuality = Math.floor(maxSafeSize / (config.boardSize + 60));
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
  ctx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
  try {
    return await standardExport(smallerCanvas, fileName, format);
  } finally {
    releaseCanvas(smallerCanvas);
  }
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
    try {
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
    } catch (error) {
      reject(error);
    }
  });
}

function releaseCanvas(canvas) {
  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
  }
}
