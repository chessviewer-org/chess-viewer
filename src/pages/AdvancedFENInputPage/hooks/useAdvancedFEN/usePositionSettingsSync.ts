import { useEffect, useRef, useState } from 'react';

import { isRecord, safeJSONParse } from '@utils';
import type { ExportFormat, PositionSettings } from './useAdvancedFEN.types';

function isPositionSettings(value: unknown): value is PositionSettings {
  if (!isRecord(value)) return false;
  return Object.keys(value).every((key) => {
    const entry = value[key];
    return entry === undefined || isRecord(entry);
  });
}

/** Arguments for the usePositionSettingsSync hook. */
interface UsePositionSettingsSyncArgs {
  currentFen: string;
  currentIndex: number;
  isChained: boolean;
  validFens: string[];
  pieceStyle: string;
  boardSize: number;
  fileName: string;
  exportQuality: number;
  showCoordsLocal: boolean;
  showCoordinateBorder: boolean;
  showThinFrame: boolean;
  isFlipped: boolean;
  showCoordinates: boolean;
  lightSquare: string;
  darkSquare: string;
  exportFormat: ExportFormat;
  initialSettingsRef: React.MutableRefObject<{
    pieceStyle: string;
    boardSize: number;
    fileName: string;
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
    setFileName: (v: string) => void;
    setExportQuality: (v: number) => void;
    setShowCoordsLocal: (v: boolean) => void;
    setShowCoordinateBorder: (v: boolean) => void;
    setShowThinFrame: (v: boolean) => void;
    setIsFlipped: (v: boolean) => void;
    setShowCoordinates: (v: boolean) => void;
    setLightSquare: (v: string) => void;
    setDarkSquare: (v: string) => void;
    setExportFormat: (v: ExportFormat) => void;
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
    fileName,
    exportQuality,
    showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    isFlipped,
    showCoordinates,
    lightSquare,
    darkSquare,
    exportFormat,
    initialSettingsRef,
    setters
  } = args;

  const isSyncingRef = useRef(false);

  const [positionSettings, setPositionSettings] = useState<PositionSettings>(
    () => {
      const saved = localStorage.getItem('advanced-fen-position-settings');
      const parsed = safeJSONParse<unknown>(saved, null);
      return isPositionSettings(parsed) ? parsed : {};
    }
  );

  useEffect(() => {
    localStorage.setItem(
      'advanced-fen-position-settings',
      JSON.stringify(positionSettings)
    );
  }, [positionSettings]);

  useEffect(() => {
    const initialSettings = initialSettingsRef.current;
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (currentFen) {
      isSyncingRef.current = true;
      const settings = positionSettings[currentFen];

      if (!isChained && settings) {
        setters.setPieceStyle(
          settings.pieceStyle ?? initialSettings.pieceStyle
        );
        setters.setBoardSize(settings.boardSize ?? initialSettings.boardSize);
        setters.setFileName(settings.fileName ?? initialSettings.fileName);
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
        if (settings.exportFormat) {
          setters.setExportFormat(settings.exportFormat);
        }
      } else if (!isChained) {
        setters.setPieceStyle(initialSettings.pieceStyle);
        setters.setBoardSize(initialSettings.boardSize);
        setters.setFileName(initialSettings.fileName);
        setters.setExportQuality(initialSettings.exportQuality);
        setters.setShowCoordsLocal(initialSettings.showCoords);
        setters.setShowCoordinateBorder(initialSettings.showCoordinateBorder);
        setters.setIsFlipped(false);
        setters.setShowCoordinates(true);
        setters.setLightSquare(initialSettings.lightSquare);
        setters.setDarkSquare(initialSettings.darkSquare);
        setters.setExportFormat('png');
      }

      timer = setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFen, currentIndex, isChained, positionSettings]);

  useEffect(() => {
    if (currentFen && !isSyncingRef.current) {
      setPositionSettings((prev) => {
        if (isChained) {
          const updated = { ...prev };
          validFens.forEach((fen) => {
            updated[fen] = {
              ...(updated[fen] || {}),
              pieceStyle,
              boardSize,
              fileName,
              exportQuality,
              showCoords: showCoordsLocal,
              showCoordinateBorder,
              showThinFrame,
              isFlipped,
              showCoordinates,
              lightSquare,
              darkSquare,
              exportFormat
            };
          });
          return updated;
        } else {
          const existing = prev[currentFen] || {};
          if (
            existing.pieceStyle === pieceStyle &&
            existing.boardSize === boardSize &&
            existing.fileName === fileName &&
            existing.exportQuality === exportQuality &&
            existing.showCoords === showCoordsLocal &&
            existing.showCoordinateBorder === showCoordinateBorder &&
            existing.showThinFrame === showThinFrame &&
            existing.isFlipped === isFlipped &&
            existing.showCoordinates === showCoordinates &&
            existing.lightSquare === lightSquare &&
            existing.darkSquare === darkSquare &&
            existing.exportFormat === exportFormat
          ) {
            return prev;
          }
          return {
            ...prev,
            [currentFen]: {
              pieceStyle,
              boardSize,
              fileName,
              exportQuality,
              showCoords: showCoordsLocal,
              showCoordinateBorder,
              showThinFrame,
              isFlipped,
              showCoordinates,
              lightSquare,
              darkSquare,
              exportFormat
            }
          };
        }
      });
    }
  }, [
    currentFen,
    isChained,
    validFens,
    pieceStyle,
    boardSize,
    fileName,
    exportQuality,
    showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    isFlipped,
    showCoordinates,
    lightSquare,
    darkSquare,
    exportFormat
  ]);

  return { positionSettings, setPositionSettings };
}
