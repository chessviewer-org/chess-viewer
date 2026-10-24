import type { ExportConfig, ProgressCallback } from './canvasExporter';
import { createUltraQualityCanvas } from './canvasRenderer';
import {
  checkCancellation,
  exportState,
  setProgress,
  waitWhilePaused
} from './exportState';

// Helpers
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

// Service
export async function createRasterBlob(
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

    return await canvasToBlob(canvas, 'image/jpeg', 0.92);
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
