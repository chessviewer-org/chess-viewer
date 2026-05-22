import { createUltraQualityCanvas } from './canvasRenderer';
import { changeDPI } from './dpiEncoder';
import {
  calculateRenderSurfaceSize
} from './imageOptimizer';
import { logger } from './logger';
import { generateBoardSVG } from './svgExporter';
import {
  isSvgRasterWorkerSupported,
  startSvgRasterWorkerTask
} from './workerRasterExport';
import { sanitizeFileName } from './validation';
import { 
  getExportInfo, 
  validateExportConfig, 
  setProgress, 
  waitWhilePaused, 
  checkCancellation, 
  resetExportState,
  exportState,
  clearActiveRasterTask,
  cancelExport,
  pauseExport,
  resumeExport
} from './exportState';

export type ProgressCallback = (progress: number, label?: string | null) => void;

export interface ExportConfig {
  boardSize: number;
  showCoords: boolean;
  exportQuality: number;
  showThinFrame?: boolean;
  fen: string;
  lightSquare: string;
  darkSquare: string;
  pieceImages: Record<string, HTMLImageElement>;
  flipped: boolean;
  showCoordinateBorder?: boolean;
}
import { FileSizeEstimates } from './imageOptimizer';

export interface ExportInfo {
  canvasWidth: number;
  canvasHeight: number;
  exportWidth: number;
  exportHeight: number;
  requestedQuality: number;
  actualQuality: number;
  maxCanvasSize: number;
  willBeReduced: boolean;
  memoryEstimateMB: number;
  isLargeExport: boolean;
  displaySize: string;
  fileSizeEstimates: FileSizeEstimates; 
  mode: string;
  physicalSizeCm: number;
  physicalWidthCm: number;
  physicalHeightCm: number;
  effectiveDPI: number;
  forceCoordinateBorder: boolean;
  renderEngine: string;
}

export { cancelExport, pauseExport, resumeExport, resetExportState, getExportInfo };

/**
 * Converts a canvas to a blob.
 * 
 * @param canvas - The source canvas
 * @param mimeType - The output mime type
 * @param quality - The image quality (0 to 1)
 * @returns Promise resolving to a Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
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
 * Creates a raster blob using the main-thread canvas.
 * 
 * @param config - The export configuration
 * @param format - The target image format
 * @param onProgress - Progress callback function
 * @returns Promise resolving to a Blob
 */
async function createCanvasRasterBlob(config: ExportConfig, format: 'png' | 'jpeg', onProgress?: ProgressCallback): Promise<Blob> {
  const canvas = await createUltraQualityCanvas({
    ...config,
    format
  });

  if (!canvas) {
    throw new Error('Canvas creation returned null');
  }

  setProgress(onProgress, 45, 'Canvas ready');
  await waitWhilePaused();
  checkCancellation();

  if (format === 'png') {
    try {
      return await canvasToBlob(canvas, 'image/png', 1.0);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  const jpegCanvas = document.createElement('canvas');
  jpegCanvas.width = canvas.width;
  jpegCanvas.height = canvas.height;
  canvas.width = 0;
  canvas.height = 0;

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

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0);

  setProgress(onProgress, 60, 'JPEG background ready');
  await waitWhilePaused();
  checkCancellation();
  try {
    return await canvasToBlob(jpegCanvas, 'image/jpeg', 0.92);
  } finally {
    jpegCanvas.width = 0;
    jpegCanvas.height = 0;
  }
}

/**
 * Creates a raster blob using the SVG worker if available.
 * 
 * @param config - The export configuration
 * @param format - The target image format
 * @param onProgress - Progress callback function
 * @returns Promise resolving to a Blob, or null if worker is not supported
 */
async function createWorkerRasterBlob(config: ExportConfig, format: 'png' | 'jpeg', onProgress?: ProgressCallback): Promise<Blob | null> {
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
  
  try {
    return await task.promise;
  } finally {
    clearActiveRasterTask();
  }
}

/**
 * Creates a raster blob, trying the worker first then falling back to main-thread.
 * 
 * @param config - The export configuration
 * @param format - The target image format
 * @param onProgress - Progress callback function
 * @returns Promise resolving to a Blob
 */
async function createRasterBlob(config: ExportConfig, format: 'png' | 'jpeg', onProgress?: ProgressCallback): Promise<Blob> {
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
 * @param config - The export configuration
 * @param fileName - Target filename
 * @param onProgress - Progress callback function
 */
export async function downloadPNG(config: ExportConfig, fileName: string, onProgress?: ProgressCallback): Promise<void> {
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
    link.download = `${safeFileName}.png`;
    document.body.appendChild(link);
    link.click();
    setProgress(onProgress, 100, 'Done');
    
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    if (error instanceof Error && error.message === 'Export cancelled') {
      throw new Error('Export cancelled', { cause: error });
    }
    throw new Error(
      `PNG export failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error instanceof Error ? error : undefined }
    );
  } finally {
    resetExportState();
  }
}

/**
 * Renders the board and triggers a JPEG download.
 * 
 * @param config - The export configuration
 * @param fileName - Target filename
 * @param onProgress - Progress callback function
 */
export async function downloadJPEG(config: ExportConfig, fileName: string, onProgress?: ProgressCallback): Promise<void> {
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
    link.download = `${safeFileName}.jpg`;
    document.body.appendChild(link);
    link.click();
    setProgress(onProgress, 100, 'Done');
    
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    if (error instanceof Error && error.message === 'Export cancelled') {
      throw new Error('Export cancelled', { cause: error });
    }
    throw new Error(
      `JPEG export failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error instanceof Error ? error : undefined }
    );
  } finally {
    resetExportState();
  }
}

/**
 * Renders the board and copies a PNG to the system clipboard.
 * 
 * @param config - The export configuration
 * @returns Promise resolving to true on success
 */
export async function copyToClipboard(config: ExportConfig): Promise<boolean> {
  resetExportState();
  let canvas: HTMLCanvasElement | null = null;
  try {
    validateExportConfig(config);
    canvas = await createUltraQualityCanvas(config);
    if (!canvas) {
      throw new Error('Canvas creation returned null');
    }
    checkCancellation();
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      if (!canvas) return reject(new Error('Canvas is null'));
      canvas.toBlob(
        (blob) => {
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
      throw new Error('Export cancelled', { cause: error });
    }
    throw new Error(
      `Copy failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error instanceof Error ? error : undefined }
    );
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    resetExportState();
  }
}

interface BatchExportResults {
  success: string[];
  failed: Array<{ format: string; error: string }>;
}

/**
 * Exports the board in multiple formats sequentially.
 * 
 * @param config - The export configuration
 * @param formats - Array of formats (e.g. ['png', 'svg'])
 * @param fileName - Target filename
 * @param onProgress - Progress callback function
 * @returns Object with success and failure details
 */
export async function batchExport(
  config: ExportConfig,
  formats: string[],
  fileName: string,
  onProgress?: ProgressCallback
): Promise<BatchExportResults> {
  resetExportState();
  validateExportConfig(config);
  
  const total = formats.length;
  const results: BatchExportResults = {
    success: [],
    failed: []
  };
  
  for (let i = 0; i < total; i++) {
    if (exportState.cancelled) {
      throw new Error('Export cancelled');
    }
    const format = formats[i];
    if (!format) continue;
    const baseProgress = (i / total) * 100;
    
    try {
      const updateProgress: ProgressCallback = (p) => {
        const totalProgress = baseProgress + p / total;
        onProgress?.(totalProgress, format);
      };
      
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
    const failedNames = results.failed.map(f => f.format);
    throw new Error(`Some exports failed: ${failedNames.join(', ')}`);
  }
  
  return results;
}
