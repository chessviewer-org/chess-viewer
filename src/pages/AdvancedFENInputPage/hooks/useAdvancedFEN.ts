import { useCallback, useEffect, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { useChessBoard, usePieceImages, useTheme } from '@hooks';
import { ADVANCED_FEN_CONFIG } from '@constants';

import { validateFEN } from '@utils';
import { useAdvancedExportActions } from './useAdvancedFEN/useAdvancedExportActions';
import type { AdvancedFENInitialProps } from './useAdvancedFEN/useAdvancedFEN.types';
import { useAdvancedNavigation } from './useAdvancedFEN/useAdvancedNavigation';
import { useAdvancedSettingsState } from './useAdvancedFEN/useAdvancedSettingsState';
import { useAdvancedUIHandlers } from './useAdvancedFEN/useAdvancedUIHandlers';
import { useExportProgress } from './useAdvancedFEN/useExportProgress';
import { useFENBatchSync } from './useAdvancedFEN/useFENBatchSync';
import { useKeyboardNavigation } from './useAdvancedFEN/useKeyboardNavigation';
import { usePositionSettingsSync } from './useAdvancedFEN/usePositionSettingsSync';

export type { AdvancedFENInitialProps };

const { DEFAULT_FENS, DEFAULT_INTERVAL, TABS } = ADVANCED_FEN_CONFIG;

/** Root hook for AdvancedFENInputPage — composes all sub-hooks and returns a unified state/handlers pair. */
export function useAdvancedFEN(props: AdvancedFENInitialProps = {}) {
  const settings = useAdvancedSettingsState(props);
  const {
    initialLightSquare,
    initialDarkSquare,
    initialSettingsRef,
    isFlipped,
    setIsFlipped,
    showCoordinates,
    setShowCoordinates,
    pieceStyle,
    setPieceStyle,
    boardSize,
    setBoardSize,
    exportQuality,
    setExportQuality,
    showCoordsLocal,
    setShowCoordsLocal,
    showCoordinateBorder,
    setShowCoordinateBorder,
    showThinFrame,
    setShowThinFrame,
    isExportModalOpen,
    setIsExportModalOpen,
    selectedFormats,
    setSelectedFormats,
    boardSizePreset,
    setBoardSizePreset,
    customBoardSizeInput,
    setCustomBoardSizeInput,
    fileNamesInput,
    setFileNamesInput
  } = settings;

  const {
    fens,
    favorites,
    currentIndex,
    setCurrentIndex,
    pastedIndex,
    fenErrors,
    duplicateWarning,
    batchList,
    removeFenInput,
    updateFen,
    handlePasteFEN,
    toggleFavorite
  } = useFENBatchSync();

  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalTime, setIntervalTime] = useState(DEFAULT_INTERVAL);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState<string>(
    searchParams.get('tab') || TABS.POSITIONS
  );

  const setActiveTab = useCallback(
    (value: React.SetStateAction<string>) => {
      setActiveTabState((current) => {
        const nextTab = typeof value === 'function' ? value(current) : value;
        setSearchParams(
          (prev) => {
            prev.set('tab', nextTab);
            return prev;
          },
          { replace: true }
        );
        return nextTab;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTabState(tab);
    }
  }, [searchParams, activeTab]);
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [isChained, setIsChained] = useState(false);

  const { lightSquare, darkSquare, setLightSquare, setDarkSquare } = useTheme({
    initialLight: initialLightSquare,
    initialDark: initialDarkSquare
  });

  const themePayload = {
    lightSquare,
    darkSquare,
    setLightSquare,
    setDarkSquare
  };

  const validFens = fens.filter((f) => f.trim() && validateFEN(f));
  const hasValidFens = validFens.length > 0;
  const displayFensCount = Math.max(batchList.length, 3);
  const safeCurrentIndex = Math.min(
    currentIndex,
    Math.max(0, validFens.length - 1)
  );
  const currentFen = hasValidFens ? (validFens[safeCurrentIndex] ?? '') : '';
  const renderFen = currentFen || DEFAULT_FENS[0] || '';

  // Validate the free-form board-size input (4–8 cm), mirroring ExportPage.
  const customBoardSizeError = (() => {
    const input = customBoardSizeInput.trim();
    if (!input) return null;
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) return 'Board size must be a valid number.';
    if (parsed < 4 || parsed > 8) {
      return 'Board size must be between 4cm and 8cm.';
    }
    return null;
  })();

  const { board: boardState } = useChessBoard(renderFen);
  const { pieceImages, isLoading: imagesLoading } = usePieceImages(pieceStyle);
  const isBoardReady =
    Array.isArray(boardState) &&
    boardState.length === 8 &&
    !imagesLoading &&
    pieceImages &&
    Object.keys(pieceImages).length > 0;

  const { positionSettings, setPositionSettings } = usePositionSettingsSync({
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
    setters: {
      setPieceStyle,
      setBoardSize,
      setBoardSizePreset,
      setCustomBoardSizeInput,
      setFileNamesInput,
      setExportQuality,
      setShowCoordsLocal,
      setShowCoordinateBorder,
      setShowThinFrame,
      setIsFlipped,
      setShowCoordinates,
      setLightSquare,
      setDarkSquare,
      setSelectedFormats
    }
  });

  const {
    exportState,
    isPaused,
    handleExportStart,
    handleExportProgress,
    handleExportFinish,
    handlePauseExport,
    handleResumeExport,
    handleCancelExportProgress
  } = useExportProgress();

  const {
    parsedNames,
    activeFileName,
    resolvedActiveFileNames,
    exportConfig,
    handleExportActive,
    handleExportBatch
  } = useAdvancedExportActions({
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
  });

  const { handleBack, handleSettingsClick, handleNotification } =
    useAdvancedNavigation({
      favorites,
      positionSettings,
      activeTab,
      setActiveTab
    });

  useEffect(() => {
    if (!isPlaying || validFens.length === 0) return undefined;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validFens.length);
    }, intervalTime * 1000);
    return () => clearInterval(timer);
  }, [isPlaying, intervalTime, validFens.length, setCurrentIndex]);

  const handlePrevious = useCallback(() => {
    if (validFens.length > 0)
      setCurrentIndex(
        (prev) => (prev - 1 + validFens.length) % validFens.length
      );
  }, [validFens.length, setCurrentIndex]);

  const handleNext = useCallback(() => {
    if (validFens.length > 0)
      setCurrentIndex((prev) => (prev + 1) % validFens.length);
  }, [validFens.length, setCurrentIndex]);

  useKeyboardNavigation({
    validFensLength: validFens.length,
    handleBack,
    handlePrevious,
    handleNext,
    setIsPlaying
  });

  const handleSetFen = useCallback(
    (newFen: string) => {
      if (!currentFen) return;
      const batchIdx = batchList.indexOf(currentFen);
      if (batchIdx !== -1) updateFen(batchIdx, newFen);
    },
    [batchList, currentFen, updateFen]
  );

  const {
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
  } = useAdvancedUIHandlers({
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
  });

  return {
    state: {
      fens,
      favorites,
      currentIndex,
      isPlaying,
      intervalTime,
      showIntervalMenu,
      pastedIndex,
      fenErrors,
      duplicateWarning,
      activeTab,
      isFlipped,
      showCoordinates,
      pieceStyle,
      boardSize,
      exportQuality,
      showCoordsLocal,
      showCoordinateBorder,
      showThinFrame,
      isExportModalOpen,
      exportState,
      isPaused,
      theme: themePayload,
      validFens,
      hasValidFens,
      displayFensCount,
      safeCurrentIndex,
      currentFen,
      boardState,
      pieceImages,
      isBoardReady,
      exportConfig,
      wizardStep,
      selectedFormats,
      boardSizePreset,
      customBoardSizeInput,
      customBoardSizeError,
      fileNamesInput,
      resolvedActiveFileNames,
      isChained,
      parsedNames,
      activeFileName
    },
    handlers: {
      handleBack,
      removeFenInput,
      updateFen,
      handlePasteFEN,
      toggleFavorite,
      handlePrevious,
      handleNext,
      handleExportStart,
      handleExportProgress,
      handleExportFinish,
      handleShowPositionsTab,
      handleTogglePlay,
      handleSetIntervalTime,
      handleToggleIntervalMenu,
      handleFlipBoard,
      handleSetFen,
      handleSettingsClick,
      handleNotification,
      handlePauseExport,
      handleResumeExport,
      handleCancelExportProgress,
      handleCloseExportModal,
      setActiveTab,
      setExportQuality: handleSetExportQuality,
      setPieceStyle: handleSetPieceStyle,
      setShowCoordsLocal: handleSetShowCoordsLocal,
      setShowCoordinateBorder: handleSetShowCoordinateBorder,
      setShowThinFrame: handleSetShowThinFrame,
      setWizardStep,
      toggleFormat: handleToggleFormat,
      selectBoardSizePreset: handleSelectBoardSizePreset,
      updateCustomBoardSize: handleUpdateCustomBoardSize,
      updateFileNames: handleUpdateFileNames,
      setIsChained,
      handleApplyPresetTheme,
      handleApplyToAll,
      handleExportActive,
      handleExportBatch
    }
  };
}
