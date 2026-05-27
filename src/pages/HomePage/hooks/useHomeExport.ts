import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  cancelExport,
  copyToClipboard,
  downloadJPEG,
  downloadPNG,
  pauseExport,
  resumeExport,
  shouldForceCoordinateBorder,
  validateFEN
} from '@utils';
import type { ExportConfig } from '@utils/canvasExporter';

/** Tracks the lifecycle of an in-progress export operation. */
export interface ExportState {
  isExporting: boolean;
  exportProgress: number;
  currentFormat: string | null;
  isPaused: boolean;
  showProgress: boolean;
}

/** Optional per-batch overrides that take precedence over saved board settings. */
interface BatchExportOverrides {
  boardSize?: number;
  exportQuality?: number;
}

export type ExportAction =
  | { type: 'START_EXPORT'; format: string }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'COMPLETE' }
  | { type: 'TOGGLE_PROGRESS' };

const exportReducer = (state: ExportState, action: ExportAction): ExportState => {
  switch (action.type) {
    case 'START_EXPORT':
      return {
        ...state,
        isExporting: true,
        currentFormat: action.format,
        exportProgress: 0,
        isPaused: false,
        showProgress: true
      };
    case 'UPDATE_PROGRESS':
      return { ...state, exportProgress: action.progress };
    case 'PAUSE':
      return { ...state, isPaused: true };
    case 'RESUME':
      return { ...state, isPaused: false };
    case 'COMPLETE':
      return {
        ...state,
        isExporting: false,
        currentFormat: null,
        exportProgress: 0,
        isPaused: false
      };
    case 'TOGGLE_PROGRESS':
      return { ...state, showProgress: !state.showProgress };
    default:
      return state;
  }
};

/** Input options for the useHomeExport hook. */
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

/** Manages PNG/JPEG/batch export lifecycle including progress tracking, pause/resume, and cancellation. */
export function useHomeExport(opts: UseHomeExportOptions) {
  const {
    fen,
    fileName,
    boardSize,
    exportQuality,
    showCoords,
    showCoordinateBorder,
    showThinFrame,
    lightSquare,
    darkSquare,
    flipped,
    saveExportFen,
    notify
  } = opts;

  const [exportState, dispatchExport] = useReducer(exportReducer, {
    isExporting: false,
    exportProgress: 0,
    currentFormat: null,
    isPaused: false,
    showProgress: true
  });

  const pieceImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  const scheduleComplete = useCallback(() => {
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    completeTimerRef.current = setTimeout(() => {
      dispatchExport({ type: 'COMPLETE' });
      completeTimerRef.current = null;
    }, 300);
  }, []);

  const handlePieceImagesChange = useCallback(
    (images: Record<string, HTMLImageElement>) => {
      pieceImagesRef.current = images;
    },
    []
  );

  const getExportConfig = useCallback(
    (overrides?: BatchExportOverrides): ExportConfig => {
      const effectiveExportQuality = overrides?.exportQuality ?? exportQuality;
      const effectiveBoardSize = overrides?.boardSize ?? boardSize;
      const forceCoordBorder = shouldForceCoordinateBorder(effectiveExportQuality);
      const effectiveCoordBorder = forceCoordBorder || showCoordinateBorder;

      return {
        boardSize: effectiveBoardSize,
        showCoords,
        showCoordinateBorder: effectiveCoordBorder,
        showThinFrame,
        lightSquare,
        darkSquare,
        flipped,
        fen,
        pieceImages: pieceImagesRef.current,
        exportQuality: effectiveExportQuality
      };
    },
    [
      boardSize,
      showCoords,
      showCoordinateBorder,
      showThinFrame,
      lightSquare,
      darkSquare,
      flipped,
      fen,
      exportQuality
    ]
  );

  const runExport = useCallback(
    async (
      format: 'png' | 'jpeg',
      runner: (
        cfg: ExportConfig,
        name: string,
        cb: (p: number) => void
      ) => Promise<void>,
      label: string
    ) => {
      if (!validateFEN(fen)) {
        notify.error('Invalid FEN — cannot export');
        return;
      }
      dispatchExport({ type: 'START_EXPORT', format });
      saveExportFen(fen);

      try {
        await runner(getExportConfig(), fileName, (progress: number) =>
          dispatchExport({ type: 'UPDATE_PROGRESS', progress })
        );
        notify.success(`${label} exported successfully`);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'Export cancelled') {
          notify.info('Export cancelled');
        } else {
          notify.error(
            `${label} export failed: ` +
              (err instanceof Error ? err.message : String(err))
          );
        }
      } finally {
        scheduleComplete();
      }
    },
    [fen, fileName, getExportConfig, saveExportFen, scheduleComplete, notify]
  );

  const handleDownloadPNG = useCallback(
    () => runExport('png', downloadPNG, 'PNG'),
    [runExport]
  );

  const handleDownloadJPEG = useCallback(
    () => runExport('jpeg', downloadJPEG, 'JPEG'),
    [runExport]
  );

  const handleCopyImage = useCallback(async () => {
    if (!validateFEN(fen)) {
      notify.error('Invalid FEN — cannot export');
      return;
    }
    try {
      await copyToClipboard(getExportConfig());
      saveExportFen(fen);
      notify.success('Image copied to clipboard');
    } catch (err: unknown) {
      notify.error(
        'Copy failed: ' + (err instanceof Error ? err.message : String(err))
      );
    }
  }, [getExportConfig, fen, saveExportFen, notify]);

  const handleBatchExport = useCallback(
    async (
      formats: string[],
      customFileNames?: string | string[],
      overrides?: BatchExportOverrides
    ) => {
      const firstFormat = formats[0] ?? 'png';
      dispatchExport({ type: 'START_EXPORT', format: firstFormat });
      saveExportFen(fen);

      try {
        const total = formats.length;
        for (let i = 0; i < total; i++) {
          const format = formats[i];
          if (!format) continue;

          const currentFileName = Array.isArray(customFileNames)
            ? customFileNames[i] || fileName
            : customFileNames || fileName;

          const baseProgress = (i / total) * 100;
          const updateProgress = (p: number) =>
            dispatchExport({
              type: 'UPDATE_PROGRESS',
              progress: baseProgress + p / total
            });

          dispatchExport({ type: 'START_EXPORT', format });

          if (format === 'png') {
            await downloadPNG(getExportConfig(overrides), currentFileName, updateProgress);
          } else if (format === 'jpeg') {
            await downloadJPEG(getExportConfig(overrides), currentFileName, updateProgress);
          } else if (format === 'svg') {
            const { downloadSVG } = await import('@utils/svgExporter');
            await downloadSVG(getExportConfig(overrides), currentFileName, updateProgress);
          }
        }
        notify.success(`Exported ${formats.length} formats successfully`);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'Export cancelled') {
          notify.info('Export cancelled');
        } else {
          notify.error(
            'Batch export failed: ' +
              (err instanceof Error ? err.message : String(err))
          );
        }
      } finally {
        scheduleComplete();
      }
    },
    [getExportConfig, fileName, fen, saveExportFen, scheduleComplete, notify]
  );

  const handleCancelExport = useCallback(() => {
    cancelExport();
    dispatchExport({ type: 'COMPLETE' });
    notify.info('Export cancelled');
  }, [notify]);

  const handlePause = useCallback(() => {
    pauseExport();
    dispatchExport({ type: 'PAUSE' });
  }, []);

  const handleResume = useCallback(() => {
    resumeExport();
    dispatchExport({ type: 'RESUME' });
  }, []);

  const toggleProgress = useCallback(() => {
    dispatchExport({ type: 'TOGGLE_PROGRESS' });
  }, []);

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
