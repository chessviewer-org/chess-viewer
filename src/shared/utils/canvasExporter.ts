import { createUltraQualityCanvas } from './canvasRenderer';
import { changeDPI } from '@chessviewer-org/chess-viewer';
import { createRasterBlob } from './exportRaster';
import {
  cancelExport,
  checkCancellation,
  exportState,
  getExportInfo,
  pauseExport,
  resetExportState,
  resumeExport,
  setProgress,
  validateExportConfig,
  waitWhilePaused
} from './exportState';
import { FileSizeEstimates } from './imageOptimizer';
import { saveBlob } from './saveBlob';

// Types
export type ProgressCallback = (
  progress: number,
  label?: string | null
) => void;

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

export { cancelExport, getExportInfo, pauseExport, resumeExport };

// Service
export async function getRasterBlob(
  config: ExportConfig,
  format: 'png' | 'jpeg',
  onProgress?: ProgressCallback
): Promise<Blob> {
  resetExportState();
  try {
    validateExportConfig(config);
    setProgress(onProgress, 5, 'Preparing');
    await waitWhilePaused();
    checkCancellation();

    const blob = await createRasterBlob(config, format, onProgress);
    setProgress(onProgress, 85, 'Image encoded');
    await waitWhilePaused();
    checkCancellation();

    const exportInfo = getExportInfo(config);
    return await changeDPI(blob, exportInfo.effectiveDPI, format);
  } finally {
    resetExportState();
  }
}

async function downloadRaster(
  config: ExportConfig,
  fileName: string,
  format: 'png' | 'jpeg',
  extension: string,
  onProgress?: ProgressCallback
): Promise<number> {
  try {
    const finalBlob = await getRasterBlob(config, format, onProgress);
    saveBlob(finalBlob, fileName, extension);
    setProgress(onProgress, 100, 'Done');
    return finalBlob.size;
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Export cancelled') {
      throw new Error('Export cancelled', { cause: error });
    }
    throw new Error(
      `${format.toUpperCase()} export failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error instanceof Error ? error : undefined }
    );
  }
}

export function downloadPNG(
  config: ExportConfig,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<number> {
  return downloadRaster(config, fileName, 'png', 'png', onProgress);
}

export function downloadJPEG(
  config: ExportConfig,
  fileName: string,
  onProgress?: ProgressCallback
): Promise<number> {
  return downloadRaster(config, fileName, 'jpeg', 'jpg', onProgress);
}

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
  } catch (error: unknown) {
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
