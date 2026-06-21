import { useCallback, useMemo } from 'react';

import { downloadJPEG, downloadPNG, downloadSVG, logger } from '@utils';
import { checkCancellation, waitWhilePaused } from '@utils';
import { parseSmartNaming } from './parseSmartNaming';
import type { ExportFormat, PositionSettings } from './useAdvancedFEN.types';

/** Arguments for the useAdvancedExportActions hook. */
interface UseAdvancedExportActionsArgs {
  currentFen: string;
  validFens: string[];
  safeCurrentIndex: number;
  pieceStyle: string;
  boardSize: number;
  fileName: string;
  exportQuality: number;
  showCoordsLocal: boolean;
  showCoordinateBorder: boolean;
  showThinFrame: boolean;
  lightSquare: string;
  darkSquare: string;
  isFlipped: boolean;
  pieceImages: Record<string, HTMLImageElement> | null;
  exportFormat: ExportFormat;
  isChained: boolean;
  positionSettings: PositionSettings;
  smartNamingInput: string;
  handleExportStart: (format: string) => void;
  handleExportProgress: (
    progress: number,
    format: string,
    status?: string
  ) => void;
  handleExportFinish: () => void;
}

/** Builds export config, parses smart file names, and handles single and batch export execution. */
export function useAdvancedExportActions(args: UseAdvancedExportActionsArgs) {
  const {
    currentFen,
    validFens,
    safeCurrentIndex,
    pieceStyle,
    boardSize,
    fileName,
    exportQuality,
    showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    lightSquare,
    darkSquare,
    isFlipped,
    pieceImages,
    exportFormat,
    isChained,
    positionSettings,
    smartNamingInput,
    handleExportStart,
    handleExportProgress,
    handleExportFinish
  } = args;

  const parsedNames = useMemo(
    () => parseSmartNaming(smartNamingInput, validFens.length),
    [smartNamingInput, validFens.length]
  );

  const activeFileName = useMemo(
    () =>
      parsedNames[safeCurrentIndex] || `${fileName}-${safeCurrentIndex + 1}`,
    [parsedNames, safeCurrentIndex, fileName]
  );

  const exportConfig = useMemo(
    () => ({
      fen: currentFen,
      pieceStyle,
      boardSize,
      showCoords: showCoordsLocal,
      showCoordinateBorder,
      showThinFrame,
      lightSquare,
      darkSquare,
      flipped: isFlipped,
      pieceImages: pieceImages || {},
      exportQuality
    }),
    [
      currentFen,
      pieceStyle,
      boardSize,
      showCoordsLocal,
      showCoordinateBorder,
      showThinFrame,
      lightSquare,
      darkSquare,
      isFlipped,
      pieceImages,
      exportQuality
    ]
  );

  const handleExportActive = useCallback(async () => {
    const format = exportFormat;
    const name = activeFileName;
    try {
      handleExportStart(format);
      const config = exportConfig;
      if (format === 'png') {
        await downloadPNG(config, name, (progress, label) => {
          handleExportProgress(progress, format, label ?? undefined);
        });
      } else if (format === 'jpeg') {
        await downloadJPEG(config, name, (progress, label) => {
          handleExportProgress(progress, format, label ?? undefined);
        });
      } else if (format === 'svg') {
        await downloadSVG(config, name, (progress, label) => {
          handleExportProgress(progress, format, label ?? undefined);
        });
      }
    } catch (err: unknown) {
      logger.error('Active export failed:', err);
    } finally {
      handleExportFinish();
    }
  }, [
    exportFormat,
    activeFileName,
    exportConfig,
    handleExportStart,
    handleExportProgress,
    handleExportFinish
  ]);

  const handleExportBatch = useCallback(async () => {
    try {
      handleExportStart(exportFormat);

      for (let i = 0; i < validFens.length; i++) {
        // Honor pause/cancel between items — otherwise the controls do nothing
        // until the whole batch finishes (required by the export pipeline rules).
        await waitWhilePaused();
        checkCancellation();

        const fen = validFens[i];
        if (!fen) continue;

        const settings = positionSettings[fen] || {};
        const activeStyle = isChained
          ? pieceStyle
          : (settings.pieceStyle ?? pieceStyle);
        const activeQuality = isChained
          ? exportQuality
          : (settings.exportQuality ?? exportQuality);
        const activeLight = isChained
          ? lightSquare
          : (settings.lightSquare ?? lightSquare);
        const activeDark = isChained
          ? darkSquare
          : (settings.darkSquare ?? darkSquare);
        const activeFlipped = isChained
          ? isFlipped
          : (settings.isFlipped ?? isFlipped);
        const activeShowCoords = isChained
          ? showCoordsLocal
          : (settings.showCoords ?? showCoordsLocal);
        const activeShowBorder = isChained
          ? showCoordinateBorder
          : (settings.showCoordinateBorder ?? showCoordinateBorder);
        const activeShowFrame = isChained
          ? showThinFrame
          : (settings.showThinFrame ?? showThinFrame);
        const format = isChained
          ? exportFormat
          : (settings.exportFormat ?? exportFormat);

        const numberedName = parsedNames[i] || `${fileName}-${i + 1}`;

        const config = {
          fen,
          pieceStyle: activeStyle,
          boardSize,
          showCoords: activeShowCoords,
          showCoordinateBorder: activeShowBorder,
          showThinFrame: activeShowFrame,
          lightSquare: activeLight,
          darkSquare: activeDark,
          flipped: activeFlipped,
          pieceImages: pieceImages || {},
          exportQuality: activeQuality
        };

        const reportProgress = (progress: number, _label?: string | null) => {
          const totalProgress = ((i + progress / 100) / validFens.length) * 100;
          handleExportProgress(
            totalProgress,
            format,
            `${i + 1}/${validFens.length}`
          );
        };

        if (format === 'png') {
          await downloadPNG(config, numberedName, reportProgress);
        } else if (format === 'jpeg') {
          await downloadJPEG(config, numberedName, reportProgress);
        } else if (format === 'svg') {
          await downloadSVG(config, numberedName, reportProgress);
        }
      }
    } catch (err: unknown) {
      // A cancellation propagates as "Export cancelled" — that is expected user
      // intent, not a failure, so it stops the batch quietly.
      if (err instanceof Error && err.message === 'Export cancelled') {
        logger.log('Batch export cancelled by user.');
      } else {
        logger.error('Batch export failed:', err);
      }
    } finally {
      handleExportFinish();
    }
  }, [
    exportFormat,
    validFens,
    positionSettings,
    isChained,
    pieceStyle,
    exportQuality,
    lightSquare,
    darkSquare,
    isFlipped,
    showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    parsedNames,
    fileName,
    pieceImages,
    boardSize,
    handleExportStart,
    handleExportProgress,
    handleExportFinish
  ]);

  return {
    parsedNames,
    activeFileName,
    exportConfig,
    handleExportActive,
    handleExportBatch
  };
}
