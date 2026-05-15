let workerJobCounter = 0;

/**
 * @typedef {Object} SvgRasterWorkerOptions
 * @property {string} svgString
 * @property {number} width
 * @property {number} height
 * @property {'png'|'jpeg'} format
 * @property {number} [quality]
 * @property {(progress: number, label?: string | null) => void} [onProgress]
 */

/**
 * @typedef {Object} SvgRasterWorkerTask
 * @property {Promise<Blob>} promise
 * @property {() => void} cancel
 */

/**
 * @returns {boolean}
 */
export function isSvgRasterWorkerSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof window.createImageBitmap === 'function'
  );
}

/**
 * Starts an SVG -> raster worker task.
 *
 * @param {SvgRasterWorkerOptions} options
 * @returns {SvgRasterWorkerTask | null}
 */
export function startSvgRasterWorkerTask(options) {
  if (!isSvgRasterWorkerSupported()) return null;
  const worker = new Worker(
    new URL('../workers/svgRasterWorker.js', import.meta.url),
    {
      type: 'module'
    }
  );
  const jobId = ++workerJobCounter;
  const quality = options.quality ?? 0.92;
  let settled = false;
  /** @type {(error: Error) => void} */
  let rejectPromise = () => {};

  const cleanup = () => {
    worker.onmessage = null;
    worker.onerror = null;
    worker.terminate();
  };

  const promise = new Promise((resolve, reject) => {
    rejectPromise = reject;
    worker.onmessage = (event) => {
      const data = event.data ?? {};
      if (data.jobId !== jobId) return;
      if (data.type === 'progress') {
        options.onProgress?.(data.progress, data.label);
        return;
      }
      if (data.type === 'done') {
        settled = true;
        cleanup();
        resolve(data.blob);
        return;
      }
      if (data.type === 'error') {
        settled = true;
        cleanup();
        reject(new Error(data.error || 'Worker rasterization failed'));
      }
    };
    worker.onerror = (event) => {
      settled = true;
      cleanup();
      reject(new Error(event.message || 'Worker crashed during rasterization'));
    };
    try {
      worker.postMessage({
        type: 'rasterize',
        jobId,
        svgString: options.svgString,
        width: options.width,
        height: options.height,
        format: options.format,
        quality
      });
    } catch (err) {
      settled = true;
      cleanup();
      reject(err);
    }
  });

  const cancel = () => {
    if (settled) return;
    settled = true;
    cleanup();
    rejectPromise(new Error('Export cancelled'));
  };

  return {
    promise,
    cancel
  };
}
