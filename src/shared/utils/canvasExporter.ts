import { createUltraQualityCanvas } from './canvasRenderer';
import { changeDPI } from './dpiEncoder';
import { sanitizeFileName } from './validation';
import {
  getExportInfo,
  validateExportConfig,
  setProgress,
  waitWhilePaused,
  checkCancellation,
  resetExportState,
  exportState,
  cancelExport,
  pauseExport,
  resumeExport
} from './exportState';
import { createRasterBlob } from './exportRaster';
import { FileSizeEstimates } from './imageOptimizer';

/** Callback invoked at each stage of an export operation with a 0–100 progress value. */
export type ProgressCallback = (progress: number, label?: string | null) => void;

/** Board state and render settings required for any export operation. */
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

/** Resolved metadata describing a planned export: dimensions, DPI, memory footprint, and file-size estimates. */
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

function triggerDownload(blob: Blob, fileName: string, extension: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.${extension}`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (document.body.contains(link)) document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

async function downloadRaster(
  config: ExportConfig,
  fileName: string,
  format: 'png' | 'jpeg',
  extension: string,
  onProgress?: ProgressCallback
): Promise<void> {
  resetExportState();
  try {
    validateExportConfig(config);
    const safeFileName = sanitizeFileName(fileName);
    setProgress(onProgress, 5, 'Preparing');
    await waitWhilePaused();
    checkCancellation();

    const blob = await createRasterBlob(config, format, onProgress);
    setProgress(onProgress, 85, 'Image encoded');
    await waitWhilePaused();
    checkCancellation();

    const exportInfo = getExportInfo(config);
    const finalBlob = await changeDPI(blob, exportInfo.effectiveDPI, format);

    triggerDownload(finalBlob, safeFileName, extension);
    setProgress(onProgress, 100, 'Done');
  } catch (error) {
    if (error instanceof Error && error.message === 'Export cancelled') {
      throw new Error('Export cancelled', { cause: error });
    }
    throw new Error(
      `${format.toUpperCase()} export failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error instanceof Error ? error : undefined }
    );
  } finally {
    resetExportState();
  }
}

/**
 * Exports the board position as a PNG file and triggers a browser download.
 *
 * @param config - Board render configuration
 * @param fileName - Base name for the downloaded file (without extension)
 * @param onProgress - Optional progress callback
 * @throws If rendering or encoding fails, or if the export is cancelled
 */
export function downloadPNG(
  config: ExportConfig,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<void> {
  return downloadRaster(config, fileName, 'png', 'png', onProgress);
}

/**
 * Exports the board position as a JPEG file and triggers a browser download.
 *
 * @param config - Board render configuration
 * @param fileName - Base name for the downloaded file (without extension)
 * @param onProgress - Optional progress callback
 * @throws If rendering or encoding fails, or if the export is cancelled
 */
export function downloadJPEG(
  config: ExportConfig,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<void> {
  return downloadRaster(config, fileName, 'jpeg', 'jpg', onProgress);
}

/**
 * Renders the board and copies it as a PNG image to the system clipboard.
 *
 * @param config - Board render configuration
 * @returns `true` on success
 * @throws If the Clipboard API is unavailable, the export is cancelled, or rendering fails
 */
export async function copyToClipboard(config: ExportConfig): Promise<boolean> {
  resetExportState();
  let canvas: HTMLCanvasElement | null = null;
  try {
    validateExportConfig(config);
    canvas = await createUltraQualityCanvas(config);
    if (!canvas) throw new Error('Canvas creation returned null');
    checkCancellation();

    const blob = await new Promise<Blob>((resolve, reject) => {
      if (!canvas) return reject(new Error('Canvas is null'));
      canvas.toBlob(
        (b) => {
          if (exportState.cancelled) {
            reject(new Error('Export cancelled'));
            return;
          }
          if (!b) reject(new Error('Failed to create blob for clipboard'));
          else resolve(b);
        },
        'image/png',
        1.0
      );
    });

    checkCancellation();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
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

/** Accumulates per-format outcomes for a batch export run. */
interface BatchExportResults {
  success: string[];
  failed: Array<{ format: string; error: string }>;
}

/**
 * Sequentially exports the board position in multiple formats.
 *
 * @param config - Board render configuration
 * @param formats - List of format strings to export (`'png'`, `'jpeg'`, `'svg'`)
 * @param fileName - Base name for each downloaded file (without extension)
 * @param onProgress - Optional progress callback aggregated across all formats
 * @returns Results object listing succeeded and failed formats
 * @throws If any format fails, or if the export is cancelled mid-batch
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
  const results: BatchExportResults = { success: [], failed: [] };

  for (let i = 0; i < total; i++) {
    if (exportState.cancelled) throw new Error('Export cancelled');
    const format = formats[i];
    if (!format) continue;
    const baseProgress = (i / total) * 100;

    try {
      const updateProgress: ProgressCallback = (p) => {
        onProgress?.(baseProgress + p / total, format);
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
        format,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  onProgress?.(100, null);

  if (results.failed.length > 0) {
    throw new Error(
      `Some exports failed: ${results.failed.map((f) => f.format).join(', ')}`
    );
  }

  return results;
}
