import { useEffect, useRef, useState } from 'react';

import { isRecord, safeJSONParse } from '@utils';
import type {
  BoardSizePreset,
  ExportFormat,
  PositionSettings
} from './useAdvancedFEN.types';

function isPositionSettings(value: unknown): value is PositionSettings {
  if (!isRecord(value)) return false;
  return Object.keys(value).every((key) => {
    const entry = value[key];
    return entry === undefined || isRecord(entry);
  });
}

/** Shallow order-independent equality for two format arrays. */
function sameFormats(a: ExportFormat[], b: ExportFormat[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((format) => b.includes(format));
}

/** Derive the BoardSizePreset from a numeric board size. */
function presetFrom(size: number): BoardSizePreset {
  if (size === 4 || size === 6 || size === 8) return size;
  return 'custom';
}

/** Arguments for the usePositionSettingsSync hook. */
interface UsePositionSettingsSyncArgs {
  currentFen: string;
  currentIndex: number;
  isChained: boolean;
  validFens: string[];
  pieceStyle: string;
  boardSize: number;
  fileNamesInput: string;
  exportQuality: number;
  showCoordsLocal: boolean;
  showCoordinateBorder: boolean;
  showThinFrame: boolean;
  isFlipped: boolean;
  showCoordinates: boolean;
  lightSquare: string;
  darkSquare: string;
  selectedFormats: ExportFormat[];
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
  setters: {
    setPieceStyle: (v: string) => void;
    setBoardSize: (v: number) => void;
    setBoardSizePreset: (v: BoardSizePreset) => void;
    setCustomBoardSizeInput: (v: string) => void;
    setFileNamesInput: (v: string) => void;
    setExportQuality: (v: number) => void;
    setShowCoordsLocal: (v: boolean) => void;
    setShowCoordinateBorder: (v: boolean) => void;
    setShowThinFrame: (v: boolean) => void;
    setIsFlipped: (v: boolean) => void;
    setShowCoordinates: (v: boolean) => void;
    setLightSquare: (v: string) => void;
    setDarkSquare: (v: string) => void;
    setSelectedFormats: (v: ExportFormat[]) => void;
  };
}

export function usePositionSettingsSync(args: UsePositionSettingsSyncArgs) {
  const {
    currentFen,
    currentIndex,
    isChained,
    validFens,
    pieceStyle,
    boardSize,
    fileNamesInput,
    exportQuality,
    showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    isFlipped,
    showCoordinates,
    lightSquare,
    darkSquare,
    selectedFormats,
    initialSettingsRef,
    setters
  } = args;

  // True while load-from-store is in progress — prevents the save effect from
  // writing back the values we just loaded (which would be a no-op but triggers
  // a redundant state update and can cause a flash).
  const isSyncingRef = useRef(false);

  const [positionSettings, setPositionSettings] = useState<PositionSettings>(
    () => {
      const saved = localStorage.getItem('advanced-fen-position-settings');
      const parsed = safeJSONParse<unknown>(saved, null);
      return isPositionSettings(parsed) ? parsed : {};
    }
  );

  // Keep a ref to the latest positionSettings so the load effect can read the
  // current store without having it in its dep array (adding it there would
  // re-trigger load every time a save happens, causing a race).
  const positionSettingsRef = useRef(positionSettings);
  positionSettingsRef.current = positionSettings;

  useEffect(() => {
    localStorage.setItem(
      'advanced-fen-position-settings',
      JSON.stringify(positionSettings)
    );
  }, [positionSettings]);

  // LOAD: when the active position changes, hydrate UI state from the store.
  // positionSettings is intentionally read via ref so this effect only fires on
  // position/chain changes, not on every save.
  useEffect(() => {
    if (!currentFen) return;

    const initialSettings = initialSettingsRef.current;
    const settings = positionSettingsRef.current[currentFen];

    isSyncingRef.current = true;

    if (!isChained && settings) {
      const size = settings.boardSize ?? initialSettings.boardSize;
      setters.setPieceStyle(settings.pieceStyle ?? initialSettings.pieceStyle);
      setters.setBoardSize(size);
      setters.setBoardSizePreset(presetFrom(size));
      setters.setCustomBoardSizeInput(String(size));
      setters.setFileNamesInput(
        settings.fileName ?? initialSettings.fileNamesInput
      );
      setters.setExportQuality(
        settings.exportQuality ?? initialSettings.exportQuality
      );
      setters.setShowCoordsLocal(
        settings.showCoords ?? initialSettings.showCoords
      );
      setters.setShowCoordinateBorder(
        settings.showCoordinateBorder ?? initialSettings.showCoordinateBorder
      );
      setters.setShowThinFrame(
        settings.showThinFrame ?? initialSettings.showThinFrame
      );
      setters.setIsFlipped(settings.isFlipped ?? false);
      setters.setShowCoordinates(settings.showCoordinates ?? true);
      if (settings.lightSquare && settings.darkSquare) {
        setters.setLightSquare(settings.lightSquare);
        setters.setDarkSquare(settings.darkSquare);
      }
      if (settings.selectedFormats && settings.selectedFormats.length > 0) {
        setters.setSelectedFormats(settings.selectedFormats);
      }
    } else if (!isChained) {
      // No saved settings for this position yet — restore defaults.
      const size = initialSettings.boardSize;
      setters.setPieceStyle(initialSettings.pieceStyle);
      setters.setBoardSize(size);
      setters.setBoardSizePreset(presetFrom(size));
      setters.setCustomBoardSizeInput(String(size));
      setters.setFileNamesInput(initialSettings.fileNamesInput);
      setters.setExportQuality(initialSettings.exportQuality);
      setters.setShowCoordsLocal(initialSettings.showCoords);
      setters.setShowCoordinateBorder(initialSettings.showCoordinateBorder);
      setters.setShowThinFrame(initialSettings.showThinFrame);
      setters.setIsFlipped(false);
      setters.setShowCoordinates(true);
      setters.setLightSquare(initialSettings.lightSquare);
      setters.setDarkSquare(initialSettings.darkSquare);
      setters.setSelectedFormats(['jpeg', 'png']);
    }

    // Use rAF so the save effect (which runs synchronously in the same commit)
    // sees isSyncingRef.current = true and skips writing back the just-loaded
    // values, then we clear the flag before the next user interaction.
    const id = requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFen, currentIndex, isChained]);

  // SAVE: persist any user-driven change to the store for the current position.
  useEffect(() => {
    if (!currentFen || isSyncingRef.current) return;

    setPositionSettings((prev) => {
      if (isChained) {
        const updated = { ...prev };
        validFens.forEach((fen) => {
          updated[fen] = {
            ...(updated[fen] ?? {}),
            pieceStyle,
            boardSize,
            fileName: fileNamesInput,
            exportQuality,
            showCoords: showCoordsLocal,
            showCoordinateBorder,
            showThinFrame,
            isFlipped,
            showCoordinates,
            lightSquare,
            darkSquare,
            selectedFormats
          };
        });
        return updated;
      }

      const existing = prev[currentFen] ?? {};
      if (
        existing.pieceStyle === pieceStyle &&
        existing.boardSize === boardSize &&
        existing.fileName === fileNamesInput &&
        existing.exportQuality === exportQuality &&
        existing.showCoords === showCoordsLocal &&
        existing.showCoordinateBorder === showCoordinateBorder &&
        existing.showThinFrame === showThinFrame &&
        existing.isFlipped === isFlipped &&
        existing.showCoordinates === showCoordinates &&
        existing.lightSquare === lightSquare &&
        existing.darkSquare === darkSquare &&
        sameFormats(existing.selectedFormats ?? [], selectedFormats)
      ) {
        return prev;
      }

      return {
        ...prev,
        [currentFen]: {
          pieceStyle,
          boardSize,
          fileName: fileNamesInput,
          exportQuality,
          showCoords: showCoordsLocal,
          showCoordinateBorder,
          showThinFrame,
          isFlipped,
          showCoordinates,
          lightSquare,
          darkSquare,
          selectedFormats
        }
      };
    });
  }, [
    currentFen,
    isChained,
    validFens,
    pieceStyle,
    boardSize,
    fileNamesInput,
    exportQuality,
    showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    isFlipped,
    showCoordinates,
    lightSquare,
    darkSquare,
    selectedFormats
  ]);

  return { positionSettings, setPositionSettings };
}
