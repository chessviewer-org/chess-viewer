import type { ExportConfig, ProgressCallback } from './canvasExporter';
import { createUltraQualityCanvas } from './canvasRenderer';
import {
  checkCancellation,
  clearActiveRasterTask,
  exportState,
  setActiveRasterTask,
  setProgress,
  waitWhilePaused
} from './exportState';
import { calculateRenderSurfaceSize } from './imageOptimizer';
import { logger } from './logger';
import { generateBoardSVG } from './svgExporter';
import {
  isSvgRasterWorkerSupported,
  startSvgRasterWorkerTask
} from './workerRasterExport';

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
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
    } catch (err: unknown) {
      reject(err);
    }
  });
}

async function createCanvasRasterBlob(
  config: ExportConfig,
  format: 'png' | 'jpeg',
  onProgress?: ProgressCallback
): Promise<Blob> {
  const canvas = await createUltraQualityCanvas({ ...config, format });

  if (!canvas) {
    throw new Error('Canvas creation returned null');
  }

  try {
    setProgress(onProgress, 45, 'Canvas ready');
    await waitWhilePaused();
    checkCancellation();

    if (format === 'png') {
      return await canvasToBlob(canvas, 'image/png', 1.0);
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
      jpegCanvas.width = 0;
      jpegCanvas.height = 0;
      throw new Error('Failed to get 2D context for JPEG conversion');
    }

    try {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0);

      setProgress(onProgress, 60, 'JPEG background ready');
      await waitWhilePaused();
      checkCancellation();
      return await canvasToBlob(jpegCanvas, 'image/jpeg', 0.92);
    } finally {
      // Release on every exit — draw/pause/cancel can throw before the blob call.
      jpegCanvas.width = 0;
      jpegCanvas.height = 0;
    }
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

async function createWorkerRasterBlob(
  config: ExportConfig,
  format: 'png' | 'jpeg',
  onProgress?: ProgressCallback
): Promise<Blob | null> {
  if (!isSvgRasterWorkerSupported()) return null;

  // When piece images are stored as blob: URLs (the hi-res rasterisation path
  // in pieceImageCache), the SVG they get embedded into as data:image/png will
  // contain large base64 chunks that Chromium's worker-side createImageBitmap
  // cannot decode. Detect this and fall through to the canvas path instead.
  const pieceValues = Object.values(config.pieceImages);
  const hasBlobPieces = pieceValues.some((img) => {
    const src = img?.currentSrc || img?.src || '';
    return src.startsWith('blob:');
  });
  if (hasBlobPieces) return null;

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

  if (!task) return null;

  // Register the cancel handle so cancelExport() can stop this worker task.
  setActiveRasterTask(task.cancel);

  try {
    return await task.promise;
  } finally {
    clearActiveRasterTask();
  }
}

/**
 * Produces a rasterized `Blob` of the board position in the requested format.
 *
 * Attempts the SVG→Worker raster path first for performance; falls back to
 * the main-thread canvas renderer if the worker is unsupported or fails.
 *
 * @param config - Board render configuration
 * @param format - Target raster format (`'png'` or `'jpeg'`)
 * @param onProgress - Optional progress callback
 * @returns Rasterized image blob
 * @throws If both the worker path and canvas fallback fail, or if the export is cancelled
 */
export async function createRasterBlob(
  config: ExportConfig,
  format: 'png' | 'jpeg',
  onProgress?: ProgressCallback
): Promise<Blob> {
  try {
    const workerBlob = await createWorkerRasterBlob(config, format, onProgress);
    if (workerBlob) return workerBlob;
  } catch (error: unknown) {
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
