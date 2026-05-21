import { logger } from './logger';

export interface SvgRasterWorkerOptions {
  svgString: string;
  width: number;
  height: number;
  format: 'png' | 'jpeg';
  quality: number;
  onProgress?: (progress: number, label?: string) => void;
}

export interface SvgRasterWorkerTask {
  promise: Promise<Blob>;
  cancel: () => void;
}

/**
 * Checks if the current environment supports OffscreenCanvas and Web Workers.
 *
 * @returns {boolean} True if supported
 */
export function isSvgRasterWorkerSupported(): boolean {
  return (
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof URL.createObjectURL !== 'undefined'
  );
}

/**
 * Starts a rasterization task in a Web Worker.
 *
 * @param {SvgRasterWorkerOptions} options - Task options
 * @returns {SvgRasterWorkerTask | null} The task object or null if not supported
 */
export function startSvgRasterWorkerTask(
  options: SvgRasterWorkerOptions
): SvgRasterWorkerTask | null {
  if (!isSvgRasterWorkerSupported()) return null;

  const worker = new Worker(
    new URL('../workers/svgRasterWorker.ts', import.meta.url),
    { type: 'module' }
  );

  const promise = new Promise<Blob>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === 'progress' && options.onProgress) {
        options.onProgress(payload.progress, payload.label);
      } else if (type === 'done') {
        resolve(payload.blob);
        worker.terminate();
      } else if (type === 'error') {
        reject(new Error(payload.message || 'Worker render failed'));
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      logger.error('SVG Raster Worker critical error:', err);
      reject(err);
      worker.terminate();
    };

    worker.postMessage({
      type: 'start',
      payload: {
        svgString: options.svgString,
        width: options.width,
        height: options.height,
        format: options.format,
        quality: options.quality
      }
    });
  });

  return {
    promise,
    cancel: () => {
      worker.terminate();
    }
  };
}
