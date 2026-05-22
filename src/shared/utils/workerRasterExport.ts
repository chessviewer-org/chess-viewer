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

// ─── Singleton worker + task queue ───────────────────────────────────────────

interface PendingTask {
  resolve: (blob: Blob) => void;
  reject: (err: Error) => void;
  onProgress: ((progress: number, label?: string) => void) | undefined;
  cancelled: boolean;
}

let sharedWorker: Worker | null = null;
// Queue of tasks waiting to run (only one runs at a time on the singleton).
const taskQueue: Array<{ id: number; options: SvgRasterWorkerOptions }> = [];
const pendingTasks = new Map<number, PendingTask>();
let nextTaskId = 1;
let workerBusy = false;

function getSharedWorker(): Worker {
  if (!sharedWorker) {
    sharedWorker = new Worker(
      new URL('../workers/svgRasterWorker.ts', import.meta.url),
      { type: 'module' }
    );

    sharedWorker.onmessage = (e: MessageEvent) => {
      const { type, payload, taskId } = e.data as {
        type: string;
        payload: { blob?: Blob; progress?: number; label?: string; message?: string };
        taskId: number;
      };
      const task = pendingTasks.get(taskId);
      if (!task) return;

      if (type === 'progress') {
        if (!task.cancelled) task.onProgress?.(payload.progress ?? 0, payload.label);
      } else if (type === 'done') {
        pendingTasks.delete(taskId);
        workerBusy = false;
        if (!task.cancelled) {
          task.resolve(payload.blob!);
        } else {
          task.reject(new Error('Export cancelled'));
        }
        drainQueue();
      } else if (type === 'error') {
        pendingTasks.delete(taskId);
        workerBusy = false;
        task.reject(new Error(payload.message ?? 'Worker render failed'));
        drainQueue();
      }
    };

    sharedWorker.onerror = (err) => {
      logger.error('SVG Raster Worker critical error:', err);
      // Reject all pending tasks and reset.
      pendingTasks.forEach((t) => t.reject(new Error('Worker crashed')));
      pendingTasks.clear();
      taskQueue.length = 0;
      workerBusy = false;
      sharedWorker = null;
    };
  }
  return sharedWorker;
}

function drainQueue() {
  if (workerBusy || taskQueue.length === 0) return;
  const next = taskQueue.shift();
  if (!next) return;
  const task = pendingTasks.get(next.id);
  if (!task || task.cancelled) {
    // Skip cancelled tasks and try the next one.
    task?.reject(new Error('Export cancelled'));
    pendingTasks.delete(next.id);
    drainQueue();
    return;
  }
  workerBusy = true;
  getSharedWorker().postMessage({
    type: 'start',
    taskId: next.id,
    payload: {
      svgString: next.options.svgString,
      width: next.options.width,
      height: next.options.height,
      format: next.options.format,
      quality: next.options.quality
    }
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

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
 * Queues a rasterization task on the singleton Web Worker.
 *
 * @param {SvgRasterWorkerOptions} options - Task options
 * @returns {SvgRasterWorkerTask | null} The task object or null if not supported
 */
export function startSvgRasterWorkerTask(
  options: SvgRasterWorkerOptions
): SvgRasterWorkerTask | null {
  if (!isSvgRasterWorkerSupported()) return null;

  const id = nextTaskId++;

  const promise = new Promise<Blob>((resolve, reject) => {
    pendingTasks.set(id, { resolve, reject, onProgress: options.onProgress, cancelled: false });
  });

  taskQueue.push({ id, options });
  // Ensure the worker is instantiated before draining.
  getSharedWorker();
  drainQueue();

  return {
    promise,
    cancel: () => {
      const task = pendingTasks.get(id);
      if (task) task.cancelled = true;
    }
  };
}
