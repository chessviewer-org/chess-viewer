import { useCallback } from 'react';

import { ADVANCED_FEN_CONFIG } from '@constants';

import type { ExportFormat, PositionSettings } from './useAdvancedFEN.types';

const { TABS } = ADVANCED_FEN_CONFIG;

/** Arguments for the useAdvancedUIHandlers hook. */
interface UseAdvancedUIHandlersArgs {
  isChained: boolean;
  safeCurrentIndex: number;
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
  setIsChained: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIntervalTime: React.Dispatch<React.SetStateAction<number>>;
  setShowIntervalMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  setIsExportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setFileName: React.Dispatch<React.SetStateAction<string>>;
  setPieceStyle: React.Dispatch<React.SetStateAction<string>>;
  setExportQuality: React.Dispatch<React.SetStateAction<number>>;
  setShowCoordsLocal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCoordinateBorder: React.Dispatch<React.SetStateAction<boolean>>;
  setShowThinFrame: React.Dispatch<React.SetStateAction<boolean>>;
  setExportFormat: React.Dispatch<React.SetStateAction<ExportFormat>>;
  setLightSquare: (v: string) => void;
  setDarkSquare: (v: string) => void;
  setPositionSettings: React.Dispatch<React.SetStateAction<PositionSettings>>;
}

/** Derives all user-facing event handlers for the preview/export tab, including chain-mode auto-unlink on per-position changes. */
export function useAdvancedUIHandlers(args: UseAdvancedUIHandlersArgs) {
  const {
    isChained,
    safeCurrentIndex,
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
    setIsChained,
    setActiveTab,
    setIsPlaying,
    setIntervalTime,
    setShowIntervalMenu,
    setIsFlipped,
    setIsExportModalOpen,
    setFileName,
    setPieceStyle,
    setExportQuality,
    setShowCoordsLocal,
    setShowCoordinateBorder,
    setShowThinFrame,
    setExportFormat,
    setLightSquare,
    setDarkSquare,
    setPositionSettings
  } = args;

  const handleShowPositionsTab = useCallback(() => {
    setActiveTab(TABS.POSITIONS);
  }, [setActiveTab]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, [setIsPlaying]);

  const handleSetIntervalTime = useCallback(
    (nextInterval: number) => {
      setIntervalTime(nextInterval);
      setShowIntervalMenu(false);
    },
    [setIntervalTime, setShowIntervalMenu]
  );

  const handleToggleIntervalMenu = useCallback(() => {
    setShowIntervalMenu((prev) => !prev);
  }, [setShowIntervalMenu]);

  const handleFlipBoard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, [setIsFlipped]);

  const handleCloseExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, [setIsExportModalOpen]);

  const handleSetFileName = useCallback(
    (name: string) => {
      setFileName(name);
    },
    [setFileName]
  );

  const handleSetExportQuality = useCallback(
    (quality: number) => {
      if (isChained && safeCurrentIndex > 0) {
        setIsChained(false);
      }
      setExportQuality(quality);
    },
    [isChained, safeCurrentIndex, setIsChained, setExportQuality]
  );

  const handleSetPieceStyle = useCallback(
    (style: string) => {
      if (isChained && safeCurrentIndex > 0) {
        setIsChained(false);
      }
      setPieceStyle(style);
    },
    [isChained, safeCurrentIndex, setIsChained, setPieceStyle]
  );

  const handleSetShowCoordsLocal = useCallback(
    (show: boolean) => {
      setShowCoordsLocal(show);
    },
    [setShowCoordsLocal]
  );

  const handleSetShowCoordinateBorder = useCallback(
    (show: boolean) => {
      setShowCoordinateBorder(show);
    },
    [setShowCoordinateBorder]
  );

  const handleSetShowThinFrame = useCallback(
    (show: boolean) => {
      setShowThinFrame(show);
    },
    [setShowThinFrame]
  );

  const handleSetExportFormat = useCallback(
    (format: ExportFormat) => {
      if (isChained && safeCurrentIndex > 0) {
        setIsChained(false);
      }
      setExportFormat(format);
    },
    [isChained, safeCurrentIndex, setIsChained, setExportFormat]
  );

  const handleApplyPresetTheme = useCallback(
    (light: string, dark: string) => {
      if (isChained && safeCurrentIndex > 0) {
        setIsChained(false);
      }
      setLightSquare(light);
      setDarkSquare(dark);
    },
    [isChained, safeCurrentIndex, setIsChained, setLightSquare, setDarkSquare]
  );

  const handleApplyToAll = useCallback(() => {
    setIsChained(true);
    setPositionSettings((prev) => {
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
    });
  }, [
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
    setIsChained,
    setPositionSettings
  ]);

  return {
    handleShowPositionsTab,
    handleTogglePlay,
    handleSetIntervalTime,
    handleToggleIntervalMenu,
    handleFlipBoard,
    handleCloseExportModal,
    handleSetFileName,
    handleSetExportQuality,
    handleSetPieceStyle,
    handleSetShowCoordsLocal,
    handleSetShowCoordinateBorder,
    handleSetShowThinFrame,
    handleSetExportFormat,
    handleApplyPresetTheme,
    handleApplyToAll
  };
}
