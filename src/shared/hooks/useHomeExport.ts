import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExportConfig } from '@/shared/utils/canvasExporter';
import {
  cancelExport,
  checkCancellation,
  pauseExport,
  resetExportState,
  resumeExport,
  waitWhilePaused
} from '@/shared/utils/exportState';
import { logger } from '@/shared/utils/logger';
import { shouldForceCoordinateBorder } from '@/shared/utils/imageOptimizer';
import { validateFEN } from '@/shared/utils/fenParser';
import {
  DEFAULT_EXPORT_FILE_NAME,
  DEFAULT_EXPORT_FOLDER_NAME,
  exportFailureReason,
  type ExportPackaging,
  FORMAT_EXTENSIONS,
  isExportCancelled,
  runExportJobs,
  summariseExport
} from '@/shared/utils/exportJobs';
import { loadExportPieces } from '@/shared/utils/pieceUtils';
import { requestedPieceMap } from '@/shared/utils/pieceRequest';
import { toSafeName } from '@/shared/utils/safeFileName';
import { saveBlob } from '@/shared/utils/saveBlob';
import {
  chooseFolderLocation,
  type ExportFile,
  writeFolder
} from '@/shared/utils/saveToFolder';

export const loadFormatExporter = () =>
  import('@/pages/AdvancedFENInputPage/utils/advancedExportHelpers');

async function saveZip(files: readonly ExportFile[], folder?: string) {
  const { zipFiles } = await import('@/shared/utils/zipFiles');
  const prefix = folder === undefined ? '' : `${folder}/`;
  const archive = await zipFiles(
    files.map(({ name, extension, blob }) => ({
      path: `${prefix}${name}.${extension}`,
      blob
    }))
  );
  saveBlob(archive, folder ?? DEFAULT_EXPORT_FOLDER_NAME, 'zip');
}

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
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
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
      const pieceImages = await loadExportPieces(
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
    if (isExportCancelled(err)) {
      opts.notify.info('Export cancelled');
    } else {
      logger.error(`${label} export failed:`, err);
      opts.notify.error(`${label} export failed: ${exportFailureReason(err)}`);
    }
  };

  const { fen, saveExportFen } = opts;
  const { error: showError } = opts.notify;
  const handleCopyImage = useCallback(async (): Promise<boolean> => {
    if (!validateFEN(fen)) {
      showError('Copy failed: the FEN is not a valid position');
      return false;
    }

    try {
      const { copyToClipboard } = await import('@/shared/utils/canvasExporter');
      await copyToClipboard(await prepareExportConfig());
      saveExportFen(fen);
      return true;
    } catch (err) {
      logger.error('Copy failed:', err);
      showError(`Copy failed: ${exportFailureReason(err)}`);
      return false;
    }
  }, [fen, showError, saveExportFen, prepareExportConfig]);

  const handleBatchExport = async (
    formats: string[],
    fileNames: string[],
    overrides?: BatchExportOverrides,
    packaging: ExportPackaging = { zip: false }
  ) => {
    resetExportState();
    setExportState((prev) => ({
      ...prev,
      isExporting: true,
      currentFormat: formats[0] ?? 'png'
    }));
    opts.saveExportFen(opts.fen);

    try {
      const folder =
        packaging.folder === undefined
          ? undefined
          : toSafeName(packaging.folder, DEFAULT_EXPORT_FOLDER_NAME);
      const location =
        folder !== undefined && !packaging.zip
          ? await chooseFolderLocation()
          : undefined;
      const { getFormatBlob } = await loadFormatExporter();
      const config = await prepareExportConfig(overrides);
      const outcome = await runExportJobs(
        formats.map((format, i) => ({
          label: format.toUpperCase(),
          run: async (): Promise<ExportFile> => {
            await waitWhilePaused();
            checkCancellation();
            const blob = await getFormatBlob(format, config, (p) => {
              setExportState((prev) => ({
                ...prev,
                currentFormat: format,
                exportProgress: (i / formats.length) * 100 + p / formats.length
              }));
            });
            return {
              name: toSafeName(fileNames[i] ?? '', DEFAULT_EXPORT_FILE_NAME),
              extension: FORMAT_EXTENSIONS[format] ?? format,
              blob
            };
          }
        }))
      );
      for (const { label, reason } of outcome.failed)
        logger.error(`${label} export failed:`, reason);
      if (outcome.results.length) {
        if (location && folder !== undefined)
          await writeFolder(location, folder, outcome.results);
        else if (packaging.zip || folder !== undefined)
          await saveZip(outcome.results, folder);
        else
          for (const { name, extension, blob } of outcome.results)
            saveBlob(blob, name, extension);
      }
      const summary = summariseExport(outcome);
      if (summary) opts.notify[summary.type](summary.message);
    } catch (err) {
      notifyError(err, 'Export');
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
    handleCopyImage,
    handleBatchExport,
    handleCancelExport,
    handlePause,
    handleResume,
    toggleProgress
  };
}
