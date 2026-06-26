import { useCallback, useMemo } from 'react';

import JSZip from 'jszip';

import {
  checkCancellation,
  downloadJPEG,
  downloadPNG,
  downloadSVG,
  getRasterBlob,
  getSVGBlob,
  logger,
  sanitizeFileName,
  saveBlob,
  waitWhilePaused
} from '@utils';
import { parseSmartNaming } from './parseSmartNaming';
import type {
  ExportConfigLike,
  ExportFormat,
  PositionSettings
} from './useAdvancedFEN.types';

const FORMAT_ORDER: ExportFormat[] = ['jpeg', 'png', 'svg'];

/** Sorts formats into a stable canonical order (jpeg → png → svg). */
function sortFormats(formats: ExportFormat[]): ExportFormat[] {
  return FORMAT_ORDER.filter((format) => formats.includes(format));
}

/** Runs the export pipeline for a single format with the given config + file name. */
function runFormatExport(
  format: ExportFormat,
  config: ExportConfigLike,
  name: string,
  onProgress: (progress: number, label?: string | null) => void
): Promise<void> {
  if (format === 'png') return downloadPNG(config, name, onProgress);
  if (format === 'jpeg') return downloadJPEG(config, name, onProgress);
  return downloadSVG(config, name, onProgress);
}

/** Arguments for the useAdvancedExportActions hook. */
interface UseAdvancedExportActionsArgs {
  currentFen: string;
  validFens: string[];
  safeCurrentIndex: number;
  pieceStyle: string;
  boardSize: number;
  exportQuality: number;
  showCoordsLocal: boolean;
  showCoordinateBorder: boolean;
  showThinFrame: boolean;
  lightSquare: string;
  darkSquare: string;
  isFlipped: boolean;
  pieceImages: Record<string, HTMLImageElement> | null;
  selectedFormats: ExportFormat[];
  isChained: boolean;
  positionSettings: PositionSettings;
  initialSettingsRef: React.MutableRefObject<{
    pieceStyle: string;
    boardSize: number;
    fileNamesInput: string;
    exportQuality: number;
    showCoords: boolean;
    showCoordinateBorder: boolean;
    showThinFrame: boolean;
    lightSquare: string;
    darkSquare: string;
  }>;
  /** Comma-separated per-format names from the File Name field (ExportPage parity). */
  fileNamesInput: string;
  handleExportStart: (format: string) => void;
  handleExportProgress: (
    progress: number,
    format: string,
    status?: string
  ) => void;
  handleExportFinish: () => void;
}

/** Builds export config, resolves file names, and handles single and batch multi-format export execution. */
export function useAdvancedExportActions(args: UseAdvancedExportActionsArgs) {
  const {
    currentFen,
    validFens,
    safeCurrentIndex,
    pieceStyle,
    boardSize,
    exportQuality,
    showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    lightSquare,
    darkSquare,
    isFlipped,
    pieceImages,
    selectedFormats,
    isChained,
    positionSettings,
    initialSettingsRef,
    fileNamesInput,
    handleExportStart,
    handleExportProgress,
    handleExportFinish
  } = args;

  const parsedNames = useMemo(
    () => parseSmartNaming(fileNamesInput, validFens.length),
    [fileNamesInput, validFens.length]
  );

  const orderedFormats = useMemo(
    () => sortFormats(selectedFormats),
    [selectedFormats]
  );

  const activeFileName = useMemo(() => {
    let raw: string;
    if (!isChained && positionSettings[currentFen]?.fileName) {
      const posName = positionSettings[currentFen].fileName as string;
      raw = parseSmartNaming(posName || 'Position', 1)[0] ?? '';
    } else {
      raw = parsedNames[safeCurrentIndex] ?? '';
    }
    return sanitizeFileName(raw || `Position-${safeCurrentIndex + 1}`);
  }, [parsedNames, safeCurrentIndex, isChained, positionSettings, currentFen]);

  /**
   * File names for the ACTIVE position. It relies entirely on the Smart-Naming
   * parser so single-format downloads keep their meaningful name.
   */
  const resolvedActiveFileNames = useMemo<Record<ExportFormat, string>>(() => {
    return {
      jpeg: activeFileName,
      png: activeFileName,
      svg: activeFileName
    };
  }, [activeFileName]);

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
    if (orderedFormats.length === 0) return;
    try {
      handleExportStart(orderedFormats[0] as string);
      const total = orderedFormats.length;

      for (let f = 0; f < orderedFormats.length; f++) {
        await waitWhilePaused();
        checkCancellation();

        const format = orderedFormats[f];
        if (!format) continue;
        const name = resolvedActiveFileNames[format];

        await runFormatExport(format, exportConfig, name, (progress) => {
          const totalProgress = ((f + progress / 100) / total) * 100;
          handleExportProgress(totalProgress, format, `${f + 1}/${total}`);
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Export cancelled') {
        logger.log('Active export cancelled by user.');
      } else {
        logger.error('Active export failed:', err);
      }
    } finally {
      handleExportFinish();
    }
  }, [
    orderedFormats,
    resolvedActiveFileNames,
    exportConfig,
    handleExportStart,
    handleExportProgress,
    handleExportFinish
  ]);

  const handleExportBatch = useCallback(async () => {
    if (orderedFormats.length === 0) return;
    try {
      handleExportStart(orderedFormats[0] as string);

      // Total unit count spans every position × every selected format so the
      // progress bar advances smoothly across the whole batch.
      const totalUnits = validFens.length * orderedFormats.length;
      let unit = 0;

      const zip = new JSZip();

      for (let i = 0; i < validFens.length; i++) {
        const fen = validFens[i];
        if (!fen) continue;

        const settings = positionSettings[fen] || {};
        const initial = initialSettingsRef.current;
        const activeStyle = isChained
          ? pieceStyle
          : (settings.pieceStyle ?? initial.pieceStyle);
        const activeQuality = isChained
          ? exportQuality
          : (settings.exportQuality ?? initial.exportQuality);
        const activeLight = isChained
          ? lightSquare
          : (settings.lightSquare ?? initial.lightSquare);
        const activeDark = isChained
          ? darkSquare
          : (settings.darkSquare ?? initial.darkSquare);
        const activeFlipped = isChained
          ? isFlipped
          : (settings.isFlipped ?? false);
        const activeShowCoords = isChained
          ? showCoordsLocal
          : (settings.showCoords ?? initial.showCoords);
        const activeShowBorder = isChained
          ? showCoordinateBorder
          : (settings.showCoordinateBorder ?? initial.showCoordinateBorder);
        const activeShowFrame = isChained
          ? showThinFrame
          : (settings.showThinFrame ?? initial.showThinFrame);
        const formats = isChained
          ? orderedFormats
          : sortFormats(settings.selectedFormats ?? orderedFormats);

        const activeBoardSize = isChained
          ? boardSize
          : (settings.boardSize ?? initial.boardSize);

        const posConfig =
          !isChained && positionSettings[fen]
            ? positionSettings[fen]
            : undefined;

        // The base name for this position
        let rawName = '';
        if (posConfig && posConfig.fileName) {
          rawName = parseSmartNaming(posConfig.fileName as string, 1)[0] ?? '';
        } else {
          const fallbackParsed = isChained
            ? parsedNames
            : parseSmartNaming(initial.fileNamesInput, validFens.length);
          rawName = fallbackParsed[i] ?? '';
        }
        const baseName = sanitizeFileName(rawName || `Position-${i + 1}`);
        const folder = zip.folder(baseName);
        if (!folder) continue;

        const config: ExportConfigLike = {
          fen,
          pieceStyle: activeStyle,
          boardSize: activeBoardSize,
          showCoords: activeShowCoords,
          showCoordinateBorder: activeShowBorder,
          showThinFrame: activeShowFrame,
          lightSquare: activeLight,
          darkSquare: activeDark,
          flipped: activeFlipped,
          pieceImages: pieceImages || {},
          exportQuality: activeQuality
        };

        for (const format of formats) {
          await waitWhilePaused();
          checkCancellation();

          const fixedUnit = unit;
          const onProgress = (progress: number) => {
            const totalProgress =
              ((fixedUnit + progress / 100) / totalUnits) * 100;
            handleExportProgress(
              totalProgress,
              format,
              `${i + 1}/${validFens.length}`
            );
          };

          try {
            if (format === 'svg') {
              const blob = await getSVGBlob(config, onProgress);
              folder.file(`${baseName}.svg`, blob);
            } else {
              const blob = await getRasterBlob(config, format, onProgress);
              const ext = format === 'jpeg' ? 'jpg' : format;
              folder.file(`${baseName}.${ext}`, blob);
            }
          } catch (e) {
            logger.error(`Failed to export ${format} for position ${i + 1}`, e);
            throw e;
          }
          unit++;
        }
      }

      handleExportProgress(99, 'zip', 'Zipping...');
      const content = await zip.generateAsync({ type: 'blob' });
      saveBlob(content, 'chess_batch_export', 'zip');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Export cancelled') {
        logger.log('Batch export cancelled by user.');
      } else {
        logger.error('Batch export failed:', err);
      }
    } finally {
      handleExportFinish();
    }
  }, [
    orderedFormats,
    validFens,
    positionSettings,
    initialSettingsRef,
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
    pieceImages,
    boardSize,
    handleExportStart,
    handleExportProgress,
    handleExportFinish
  ]);

  return {
    parsedNames,
    activeFileName,
    resolvedActiveFileNames,
    exportConfig,
    handleExportActive,
    handleExportBatch
  };
}
