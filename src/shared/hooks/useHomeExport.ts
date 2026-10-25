import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExportConfig } from '@/shared/utils/canvasExporter';
import {
  cancelExport,
  pauseExport,
  resumeExport
} from '@/shared/utils/exportState';
import { logger } from '@/shared/utils/logger';
import { shouldForceCoordinateBorder } from '@/shared/utils/imageOptimizer';
import { validateFEN } from '@/shared/utils/fenParser';
import { preloadPieceStyle } from '@/shared/utils/pieceUtils';
import { requestedPieceMap } from '@/shared/utils/pieceRequest';

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
  pieceStyle: string;
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
  const handlePieceImagesChange = useCallback(
    (images: Record<string, HTMLImageElement>) => {
      pieceImagesRef.current = images;
    },
    []
  );

  const getExportConfig = useCallback(
    (overrides?: BatchExportOverrides): ExportConfig => {
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
    },
    [
      opts.exportQuality,
      opts.boardSize,
      opts.showCoordinateBorder,
      opts.showCoords,
      opts.showThinFrame,
      opts.lightSquare,
      opts.darkSquare,
      opts.flipped,
      opts.fen
    ]
  );

  const prepareExportConfig = useCallback(
    async (overrides?: BatchExportOverrides): Promise<ExportConfig> => {
      const config = getExportConfig(overrides);
      const pieceImages = await preloadPieceStyle(
        opts.pieceStyle,
        requestedPieceMap({ positions: config.fen })
      );
      return { ...config, pieceImages };
    },
    [getExportConfig, opts.pieceStyle]
  );

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
      const config = await prepareExportConfig();
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

  const handleDownloadPNG = () =>
    runExport(
      'png',
      async (...args) => {
        const { downloadPNG } = await import('@/shared/utils/canvasExporter');
        return downloadPNG(...args);
      },
      'PNG'
    );
  const handleDownloadJPEG = () =>
    runExport(
      'jpeg',
      async (...args) => {
        const { downloadJPEG } = await import('@/shared/utils/canvasExporter');
        return downloadJPEG(...args);
      },
      'JPEG'
    );

  const { fen, saveExportFen } = opts;
  const { success: showSuccess, error: showError } = opts.notify;
  const handleCopyImage = useCallback(async () => {
    if (!validateFEN(fen)) {
      showError('Invalid FEN — cannot copy');
      return;
    }

    try {
      const { copyToClipboard } = await import('@/shared/utils/canvasExporter');
      await copyToClipboard(await prepareExportConfig());
      saveExportFen(fen);
      showSuccess('Image copied');
    } catch (err) {
      logger.error('Copy failed:', err);
      showError('Copy failed');
    }
  }, [fen, showError, showSuccess, saveExportFen, prepareExportConfig]);

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
      const { runFormatExport } =
        await import('@/pages/AdvancedFENInputPage/utils/advancedExportHelpers');
      const config = await prepareExportConfig(overrides);
      for (let i = 0; i < formats.length; i++) {
        const format = formats[i];
        if (!format) continue;

        const currentFileName = Array.isArray(customFileNames)
          ? customFileNames[i] || opts.fileName
          : customFileNames || opts.fileName;

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
