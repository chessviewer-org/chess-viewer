import { useEffect, useRef, useState } from 'react';
import {
  ExportConfig,
  cancelExport,
  copyToClipboard,
  downloadJPEG,
  downloadPNG,
  logger,
  pauseExport,
  resumeExport,
  shouldForceCoordinateBorder,
  validateFEN
} from '@utils';
import { runFormatExport } from '@/pages/AdvancedFENInputPage/utils/advancedExportHelpers';

// Types
export interface ExportState {
  isExporting: boolean;
  exportProgress: number;
  currentFormat: string | null;
  isPaused: boolean;
  showProgress: boolean;
  actualBytes: number | null;
}

interface BatchExportOverrides {
  boardSize?: number;
  exportQuality?: number;
}

interface UseHomeExportOptions {
  fen: string;
  fileName: string;
  boardSize: number;
  exportQuality: number;
  showCoords: boolean;
  showCoordinateBorder: boolean;
  showThinFrame: boolean;
  lightSquare: string;
  darkSquare: string;
  flipped: boolean;
  saveExportFen: (fen: string) => void;
  notify: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

export function useHomeExport(opts: UseHomeExportOptions) {
  // State
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    exportProgress: 0,
    currentFormat: null,
    isPaused: false,
    showProgress: true,
    actualBytes: null
  });

  const pieceImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  // Actions
  const handlePieceImagesChange = (
    images: Record<string, HTMLImageElement>
  ) => {
    pieceImagesRef.current = images;
  };

  const getExportConfig = (overrides?: BatchExportOverrides): ExportConfig => {
    const quality = overrides?.exportQuality ?? opts.exportQuality;
    const size = overrides?.boardSize ?? opts.boardSize;
    const border =
      shouldForceCoordinateBorder(quality) || opts.showCoordinateBorder;

    return {
      boardSize: size,
      showCoords: opts.showCoords,
      showCoordinateBorder: border,
      showThinFrame: opts.showThinFrame,
      lightSquare: opts.lightSquare,
      darkSquare: opts.darkSquare,
      flipped: opts.flipped,
      fen: opts.fen,
      pieceImages: pieceImagesRef.current,
      exportQuality: quality
    };
  };

  const finishExport = () => {
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);

    completeTimerRef.current = setTimeout(() => {
      setExportState((prev) => ({
        ...prev,
        isExporting: false,
        currentFormat: null,
        exportProgress: 0,
        isPaused: false,
        actualBytes: null
      }));
      completeTimerRef.current = null;
    }, 300);
  };

  const notifyError = (err: unknown, label: string) => {
    const error = err as Error;
    if (error?.message === 'Export cancelled') {
      opts.notify.info('Export cancelled');
    } else {
      logger.error(`${label} export failed:`, err);
      opts.notify.error(`${label} export failed`);
    }
  };

  const runExport = async (
    format: 'png' | 'jpeg',
    runner: (
      config: ExportConfig,
      filename: string,
      cb: (p: number) => void
    ) => Promise<number>,
    label: string
  ) => {
    if (!validateFEN(opts.fen)) {
      opts.notify.error('Invalid FEN — cannot export');
      return;
    }

    setExportState((prev) => ({
      ...prev,
      isExporting: true,
      currentFormat: format,
      exportProgress: 0,
      isPaused: false,
      actualBytes: null
    }));
    opts.saveExportFen(opts.fen);

    try {
      const config = getExportConfig();
      const bytes = await runner(config, opts.fileName, (progress) => {
        setExportState((prev) => ({ ...prev, exportProgress: progress }));
      });
      setExportState((prev) => ({ ...prev, actualBytes: bytes }));
      opts.notify.success(`${label} downloaded`);
    } catch (err) {
      notifyError(err, label);
    } finally {
      finishExport();
    }
  };

  const handleDownloadPNG = () => runExport('png', downloadPNG, 'PNG');
  const handleDownloadJPEG = () => runExport('jpeg', downloadJPEG, 'JPEG');

  const handleCopyImage = async () => {
    if (!validateFEN(opts.fen)) {
      opts.notify.error('Invalid FEN — cannot copy');
      return;
    }

    try {
      await copyToClipboard(getExportConfig());
      opts.saveExportFen(opts.fen);
      opts.notify.success('Image copied');
    } catch (err) {
      logger.error('Copy failed:', err);
      opts.notify.error('Copy failed');
    }
  };

  const handleBatchExport = async (
    formats: string[],
    customFileNames?: string | string[],
    overrides?: BatchExportOverrides
  ) => {
    setExportState((prev) => ({
      ...prev,
      isExporting: true,
      currentFormat: formats[0] ?? 'png'
    }));
    opts.saveExportFen(opts.fen);

    try {
      for (let i = 0; i < formats.length; i++) {
        const format = formats[i];
        if (!format) continue;

        const currentFileName = Array.isArray(customFileNames)
          ? customFileNames[i] || opts.fileName
          : customFileNames || opts.fileName;

        const config = getExportConfig(overrides);

        await runFormatExport(format, config, currentFileName, (p) => {
          setExportState((prev) => ({
            ...prev,
            currentFormat: format,
            exportProgress: (i / formats.length) * 100 + p / formats.length
          }));
        });
      }
      opts.notify.success(`${formats.length} formats downloaded`);
    } catch (err) {
      notifyError(err, 'Batch export');
    } finally {
      finishExport();
    }
  };

  const handleCancelExport = () => {
    cancelExport();
    setExportState((prev) => ({
      ...prev,
      isExporting: false,
      currentFormat: null,
      exportProgress: 0,
      isPaused: false,
      actualBytes: null
    }));
    opts.notify.info('Export cancelled');
  };

  const handlePause = () => {
    pauseExport();
    setExportState((prev) => ({ ...prev, isPaused: true }));
  };

  const handleResume = () => {
    resumeExport();
    setExportState((prev) => ({ ...prev, isPaused: false }));
  };

  const toggleProgress = () => {
    setExportState((prev) => ({ ...prev, showProgress: !prev.showProgress }));
  };

  return {
    exportState,
    handlePieceImagesChange,
    getExportConfig,
    handleDownloadPNG,
    handleDownloadJPEG,
    handleCopyImage,
    handleBatchExport,
    handleCancelExport,
    handlePause,
    handleResume,
    toggleProgress
  };
}
