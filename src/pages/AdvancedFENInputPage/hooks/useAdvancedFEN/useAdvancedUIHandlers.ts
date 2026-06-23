import { useCallback } from 'react';

import { ADVANCED_FEN_CONFIG } from '@constants';

import type {
  BoardSizePreset,
  ExportFormat,
  PositionSettings
} from './useAdvancedFEN.types';

const { TABS } = ADVANCED_FEN_CONFIG;

const BOARD_SIZE_MIN = 4;
const BOARD_SIZE_MAX = 8;

function clampBoardSize(value: number): number {
  return Math.min(Math.max(value, BOARD_SIZE_MIN), BOARD_SIZE_MAX);
}

/** Arguments for the useAdvancedUIHandlers hook. */
interface UseAdvancedUIHandlersArgs {
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
  setIsChained: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  setIntervalTime: React.Dispatch<React.SetStateAction<number>>;
  setShowIntervalMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  setIsExportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPieceStyle: React.Dispatch<React.SetStateAction<string>>;
  setExportQuality: React.Dispatch<React.SetStateAction<number>>;
  setShowCoordsLocal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowCoordinateBorder: React.Dispatch<React.SetStateAction<boolean>>;
  setShowThinFrame: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedFormats: React.Dispatch<React.SetStateAction<ExportFormat[]>>;
  setBoardSize: React.Dispatch<React.SetStateAction<number>>;
  setBoardSizePreset: React.Dispatch<React.SetStateAction<BoardSizePreset>>;
  setCustomBoardSizeInput: React.Dispatch<React.SetStateAction<string>>;
  setFileNamesInput: React.Dispatch<React.SetStateAction<string>>;
  setLightSquare: (v: string) => void;
  setDarkSquare: (v: string) => void;
  setPositionSettings: React.Dispatch<React.SetStateAction<PositionSettings>>;
}

/** Derives all user-facing event handlers for the preview/export tab, including chain-mode auto-unlink on per-position changes. */
export function useAdvancedUIHandlers(args: UseAdvancedUIHandlersArgs) {
  const {
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
    setIsChained,
    setActiveTab,
    setIsPlaying,
    setIntervalTime,
    setShowIntervalMenu,
    setIsFlipped,
    setIsExportModalOpen,
    setPieceStyle,
    setExportQuality,
    setShowCoordsLocal,
    setShowCoordinateBorder,
    setShowThinFrame,
    setSelectedFormats,
    setBoardSize,
    setBoardSizePreset,
    setCustomBoardSizeInput,
    setFileNamesInput,
    setLightSquare,
    setDarkSquare,
    setPositionSettings
  } = args;

  /** Breaks the chain when the user makes a per-position change while chain-sync is active. */
  const unlinkIfChained = useCallback(() => {
    if (isChained) {
      setIsChained(false);
    }
  }, [isChained, setIsChained]);

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

  const handleSetExportQuality = useCallback(
    (quality: number) => {
      unlinkIfChained();
      setExportQuality(quality);
    },
    [unlinkIfChained, setExportQuality]
  );

  const handleSetPieceStyle = useCallback(
    (style: string) => {
      unlinkIfChained();
      setPieceStyle(style);
    },
    [unlinkIfChained, setPieceStyle]
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

  /** Toggles a format in/out of the multi-select set, keeping at least one selected. */
  const handleToggleFormat = useCallback(
    (format: ExportFormat) => {
      unlinkIfChained();
      setSelectedFormats((prev) => {
        if (prev.includes(format)) {
          if (prev.length === 1) return prev;
          return prev.filter((f) => f !== format);
        }
        return [...prev, format];
      });
    },
    [unlinkIfChained, setSelectedFormats]
  );

  /** Selects a centimetre board-size preset (or 'custom') and syncs the numeric board size. */
  const handleSelectBoardSizePreset = useCallback(
    (preset: BoardSizePreset) => {
      unlinkIfChained();
      setBoardSizePreset(preset);
      if (preset !== 'custom') {
        setBoardSize(preset);
        setCustomBoardSizeInput(String(preset));
      }
    },
    [unlinkIfChained, setBoardSizePreset, setBoardSize, setCustomBoardSizeInput]
  );

  /** Updates the free-form centimetre input, switching to the 'custom' preset. */
  const handleUpdateCustomBoardSize = useCallback(
    (value: string) => {
      const next = value.trim();
      if (next !== '' && !/^\d*\.?\d*$/.test(next)) return;

      unlinkIfChained();
      setBoardSizePreset('custom');
      setCustomBoardSizeInput(value);

      if (next === '') return;
      const parsed = Number(next);
      if (Number.isFinite(parsed)) {
        setBoardSize(clampBoardSize(parsed));
      }
    },
    [unlinkIfChained, setBoardSizePreset, setCustomBoardSizeInput, setBoardSize]
  );

  /** Updates the comma-separated per-format file-name input. */
  const handleUpdateFileNames = useCallback(
    (value: string) => {
      unlinkIfChained();
      setFileNamesInput(value);
    },
    [unlinkIfChained, setFileNamesInput]
  );

  const handleApplyPresetTheme = useCallback(
    (light: string, dark: string) => {
      unlinkIfChained();
      setLightSquare(light);
      setDarkSquare(dark);
    },
    [unlinkIfChained, setLightSquare, setDarkSquare]
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
    });
  }, [
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
    handleSetExportQuality,
    handleSetPieceStyle,
    handleSetShowCoordsLocal,
    handleSetShowCoordinateBorder,
    handleSetShowThinFrame,
    handleToggleFormat,
    handleSelectBoardSizePreset,
    handleUpdateCustomBoardSize,
    handleUpdateFileNames,
    handleApplyPresetTheme,
    handleApplyToAll
  };
}
