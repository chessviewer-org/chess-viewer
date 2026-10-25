import { changeDPI, type SquarePattern } from '@chessviewer-org/chess-viewer';
import { createRasterBlob } from './exportRaster';
import {
  cancelExport,
  checkCancellation,
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
  squarePattern?: SquarePattern;
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
}

export { cancelExport, getExportInfo, pauseExport, resumeExport };

// Service
export async function getRasterBlob(
  config: ExportConfig,
  format: 'png' | 'jpeg',
  onProgress?: ProgressCallback
): Promise<Blob> {
  validateExportConfig(config);
  setProgress(onProgress, 5, 'Preparing');
  await waitWhilePaused();
  checkCancellation();

  const blob = await createRasterBlob(config, format, onProgress);
  setProgress(onProgress, 85, 'Image encoded');
  await waitWhilePaused();
  checkCancellation();

  const exportInfo = getExportInfo(config);
  return changeDPI(blob, exportInfo.effectiveDPI, format);
}

async function downloadRaster(
  config: ExportConfig,
  fileName: string,
  format: 'png' | 'jpeg',
  extension: string,
  onProgress?: ProgressCallback
): Promise<number> {
  resetExportState();
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
  } finally {
    resetExportState();
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

async function writeClipboardImage(blob: Blob): Promise<void> {
  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write)
    throw new Error('this browser cannot copy images to the clipboard');
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError')
      throw new Error(
        'the browser blocked clipboard access, click the page and try again'
      );
    throw error;
  }
}

export async function copyToClipboard(config: ExportConfig): Promise<boolean> {
  resetExportState();
  try {
    validateExportConfig(config);
    const blob = await createRasterBlob(config, 'png');
    checkCancellation();
    await writeClipboardImage(blob);
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
    resetExportState();
  }
}
