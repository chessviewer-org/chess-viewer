import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Eye, List } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ToolPageHeader } from '@/components/layout';
import {
  ControlPanel,
  ExportOptionsDialog,
  ExportProgress
} from '@/components/features';
import { ADVANCED_FEN_CONFIG } from '@/constants';
import { useFENBatch } from '@/contexts';
import { useChessBoard, usePieceImages, useTheme } from '@/hooks';
import {
  cancelExport,
  getFENValidationError,
  logger,
  pauseExport,
  resumeExport,
  validateFEN
} from '@/utils';
import { getStoredValue, MAX_FEN_LENGTH } from '@/utils/validation';

import BoardDisplay from './BoardDisplay';
import PlaybackControls from './PlaybackControls';
import PositionsTab from './PositionsTab';
import QuickActionsPanel from './QuickActionsPanel';

const {
  MAX_FENS,
  DEFAULT_FENS,
  DEFAULT_INTERVAL,
  INTERVAL_OPTIONS,
  TABS,
  STORAGE_KEYS
} = ADVANCED_FEN_CONFIG;

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const AdvancedFENInputPage = memo(function AdvancedFENInputPage({
  pieceStyle: initialPieceStyle = 'cburnett',
  boardSize: initialBoardSize = 480,
  fileName: initialFileName = 'chess-board',
  exportQuality: initialExportQuality = 1.0,
  showCoords: initialShowCoords = true,
  showCoordinateBorder: initialShowCoordinateBorder = true,
  showThinFrame: initialShowThinFrame = false,
  lightSquare: initialLightSquare = '#f0d9b5',
  darkSquare: initialDarkSquare = '#b58863'
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchList, removeFromBatch, updateBatchItem, addToBatch } =
    useFENBatch();
  const duplicateTimeoutRef = useRef(null);
  const pastedTimeoutRef = useRef(null);
  const addedFenRef = useRef(false);
  const initialSettingsRef = useRef({
    pieceStyle: initialPieceStyle,
    boardSize: initialBoardSize,
    fileName: initialFileName,
    exportQuality: initialExportQuality,
    showCoords: initialShowCoords,
    showCoordinateBorder: initialShowCoordinateBorder,
    showThinFrame: initialShowThinFrame,
    lightSquare: initialLightSquare,
    darkSquare: initialDarkSquare
  });
  const fens = useMemo(() => {
    const arr = batchList.map((fen) =>
      typeof fen === 'string' ? fen.slice(0, MAX_FEN_LENGTH) : ''
    );
    while (arr.length < 3) arr.push('');
    if (arr.every((f) => f.trim().length > 0) && arr.length < MAX_FENS) {
      arr.push('');
    }
    return arr;
  }, [batchList]);
  const [favorites, setFavorites] = useState(() => {
    const parsed = getStoredValue(STORAGE_KEYS.FAVORITES, null);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [interval, setIntervalTime] = useState(DEFAULT_INTERVAL);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [pastedIndex, setPastedIndex] = useState(null);
  const [fenErrors, setFenErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.POSITIONS);
  const [positionSettings, setPositionSettings] = useState(() => {
    const parsed = getStoredValue('advanced-fen-position-settings', null);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  });
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [pieceStyle, setPieceStyle] = useState(initialPieceStyle);
  const [boardSize, setBoardSize] = useState(initialBoardSize);
  const [fileName, setFileName] = useState(initialFileName);
  const [exportQuality, setExportQuality] = useState(initialExportQuality);
  const [showCoordsLocal, setShowCoordsLocal] = useState(initialShowCoords);
  const [showCoordinateBorder, setShowCoordinateBorder] = useState(
    initialShowCoordinateBorder
  );
  const [showThinFrame, setShowThinFrame] = useState(initialShowThinFrame);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportState, setExportState] = useState({
    isExporting: false,
    progress: 0,
    currentFormat: '',
    status: ''
  });
  const [isPaused, setIsPaused] = useState(false);
  const theme = useTheme({
    initialLight: initialLightSquare,
    initialDark: initialDarkSquare
  });
  const validFens = fens.filter((f) => f.trim() && validateFEN(f));
  const hasValidFens = validFens.length > 0;
  const displayFensCount = Math.max(batchList.length, 3);
  const safeCurrentIndex = Math.min(
    currentIndex,
    Math.max(0, validFens.length - 1)
  );
  const currentFen = hasValidFens ? validFens[safeCurrentIndex] : '';
  const renderFen = currentFen || DEFAULT_FENS[0];
  const boardState = useChessBoard(renderFen);
  const { pieceImages, isLoading: imagesLoading } = usePieceImages(pieceStyle);
  const isBoardReady =
    Array.isArray(boardState) &&
    boardState.length === 8 &&
    !imagesLoading &&
    pieceImages &&
    Object.keys(pieceImages).length > 0;

  useEffect(() => {
    const restoreTab = location.state?.restoreTab;
    if (restoreTab) {
      setActiveTab(restoreTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(
      'advanced-fen-position-settings',
      JSON.stringify(positionSettings)
    );
  }, [positionSettings]);

  useEffect(() => {
    const initialSettings = initialSettingsRef.current;
    if (currentFen) {
      const settings = positionSettings[currentFen];
      if (settings) {
        setPieceStyle(settings.pieceStyle ?? initialSettings.pieceStyle);
        setBoardSize(settings.boardSize ?? initialSettings.boardSize);
        setFileName(settings.fileName ?? initialSettings.fileName);
        setExportQuality(
          settings.exportQuality ?? initialSettings.exportQuality
        );
        setShowCoordsLocal(settings.showCoords ?? initialSettings.showCoords);
        setShowCoordinateBorder(
          settings.showCoordinateBorder ?? initialSettings.showCoordinateBorder
        );
        setShowThinFrame(
          settings.showThinFrame ?? initialSettings.showThinFrame
        );
        setIsFlipped(settings.isFlipped ?? false);
        setShowCoordinates(settings.showCoordinates ?? true);
        if (settings.lightSquare && settings.darkSquare) {
          theme.setLightSquare(settings.lightSquare);
          theme.setDarkSquare(settings.darkSquare);
        }
      } else {
        setPieceStyle(initialSettings.pieceStyle);
        setBoardSize(initialSettings.boardSize);
        setFileName(initialSettings.fileName);
        setExportQuality(initialSettings.exportQuality);
        setShowCoordsLocal(initialSettings.showCoords);
        setShowCoordinateBorder(initialSettings.showCoordinateBorder);
        setIsFlipped(false);
        setShowCoordinates(true);
        theme.setLightSquare(initialSettings.lightSquare);
        theme.setDarkSquare(initialSettings.darkSquare);
      }
    }
  }, [currentFen, currentIndex, positionSettings, theme]);

  useEffect(() => {
    if (currentFen) {
      setPositionSettings((prev) => ({
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
          lightSquare: theme.lightSquare,
          darkSquare: theme.darkSquare
        }
      }));
    }
  }, [
    currentFen,
    pieceStyle,
    boardSize,
    fileName,
    exportQuality,
    showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    isFlipped,
    showCoordinates,
    theme.lightSquare,
    theme.darkSquare
  ]);

  useEffect(() => {
    const errors = {};
    fens.forEach((fen, index) => {
      const trimmed = fen.trim();
      if (trimmed) {
        const error = getFENValidationError(trimmed);
        if (error) errors[index] = error;
      }
    });
    setFenErrors(errors);
    const validCount = fens.filter((f) => f.trim() && validateFEN(f)).length;
    if (currentIndex >= validCount && validCount > 0) setCurrentIndex(0);
  }, [fens, currentIndex]);

  useEffect(() => {
    let timer;
    if (isPlaying && validFens.length > 0) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % validFens.length);
      }, interval * 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, interval, validFens.length]);

  useEffect(() => {
    return () => {
      if (duplicateTimeoutRef.current)
        clearTimeout(duplicateTimeoutRef.current);
      if (pastedTimeoutRef.current) clearTimeout(pastedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (location.state?.addFen && !addedFenRef.current) {
      const rawFenToAdd = location.state.addFen;
      const fenToAdd =
        typeof rawFenToAdd === 'string'
          ? rawFenToAdd.slice(0, MAX_FEN_LENGTH)
          : '';
      if (!fens.some((f) => f.trim() === fenToAdd)) {
        const emptyIndex = fens.findIndex((f) => !f.trim());
        if (emptyIndex !== -1 && emptyIndex < batchList.length) {
          updateBatchItem(emptyIndex, fenToAdd);
          setPastedIndex(emptyIndex);
        } else if (batchList.length < MAX_FENS) {
          addToBatch(fenToAdd);
          setPastedIndex(batchList.length);
        }
        if (pastedTimeoutRef.current) clearTimeout(pastedTimeoutRef.current);
        pastedTimeoutRef.current = setTimeout(() => setPastedIndex(null), 2000);
      }
      addedFenRef.current = true;
      window.history.replaceState({}, document.title);
    }
  }, [location.state, fens, batchList.length, updateBatchItem, addToBatch]);

  const handleBack = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      localStorage.setItem(
        'advanced-fen-position-settings',
        JSON.stringify(positionSettings)
      );
    } catch (err) {
      logger.warn('Failed to save settings:', err);
    }
    navigate(-1);
  }, [navigate, favorites, positionSettings]);

  /**
   * Removes a FEN slot from the batch list and clears its favorite state.
   *
   * @param {number} index - Slot index to remove
   * @returns {void}
   */
  function removeFenInput(index) {
    if (index < batchList.length) {
      removeFromBatch(index);
      if (currentIndex >= batchList.length - 1) {
        setCurrentIndex(Math.max(0, batchList.length - 2));
      }
      const fenToRemove = batchList[index];
      if (fenToRemove) {
        const newFavorites = {
          ...favorites
        };
        delete newFavorites[fenToRemove];
        setFavorites(newFavorites);
      }
    }
  }

  /**
   * Updates or adds a FEN value while preventing duplicates.
   *
   * @param {number} index - Target slot index
   * @param {string} value - Raw FEN value
   * @returns {void}
   */
  function updateFen(index, value) {
    const clampedValue =
      typeof value === 'string'
        ? value.slice(0, MAX_FEN_LENGTH)
        : String(value ?? '').slice(0, MAX_FEN_LENGTH);
    const trimmedValue = clampedValue.trim();
    if (
      trimmedValue &&
      batchList.some((f, i) => i !== index && f === trimmedValue)
    ) {
      setDuplicateWarning(index);
      if (duplicateTimeoutRef.current)
        clearTimeout(duplicateTimeoutRef.current);
      duplicateTimeoutRef.current = setTimeout(
        () => setDuplicateWarning(null),
        3000
      );
      return;
    }
    if (index < batchList.length) {
      updateBatchItem(index, clampedValue);
    } else if (trimmedValue && batchList.length < MAX_FENS) {
      addToBatch(trimmedValue);
    }
  }

  /**
   * Reads a FEN string from the clipboard and inserts it into the target slot.
   *
   * @param {number} index - Slot index that receives the pasted FEN
   * @returns {Promise<void>}
   */
  async function handlePasteFEN(index) {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        updateFen(index, text.trim());
        setPastedIndex(index);
        if (pastedTimeoutRef.current) clearTimeout(pastedTimeoutRef.current);
        pastedTimeoutRef.current = setTimeout(() => setPastedIndex(null), 2000);
      }
    } catch (err) {
      logger.error('Failed to paste:', err);
    }
  }

  /**
   * Toggles the favorite state for a valid FEN entry.
   *
   * @param {string} fen - FEN string to toggle
   * @returns {void}
   */
  function toggleFavorite(fen) {
    if (!fen || !validateFEN(fen)) return;
    setFavorites((prev) => ({
      ...prev,
      [fen]: !prev[fen]
    }));
  }

  const handlePrevious = useCallback(() => {
    if (validFens.length > 0)
      setCurrentIndex(
        (prev) => (prev - 1 + validFens.length) % validFens.length
      );
  }, [validFens.length]);
  const handleNext = useCallback(() => {
    if (validFens.length > 0)
      setCurrentIndex((prev) => (prev + 1) % validFens.length);
  }, [validFens.length]);

  useEffect(() => {
    /**
     * Handles keyboard shortcuts for navigation and playback.
     *
     * @param {KeyboardEvent} e - Browser keyboard event
     * @returns {void}
     */
    function handleKeyDown(e) {
      if (e.key === 'Escape') handleBack();
      else if (e.key === 'ArrowLeft' && validFens.length > 0) handlePrevious();
      else if (e.key === 'ArrowRight' && validFens.length > 0) handleNext();
      else if (e.key === ' ' && validFens.length > 0) {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, handleNext, handlePrevious, validFens.length]);

  const pageTabs = [
    {
      id: TABS.POSITIONS,
      icon: List,
      label: 'Positions'
    },
    {
      id: 'preview-export',
      icon: Eye,
      label: 'Preview / Export'
    }
  ];
  const exportConfig = {
    fen: currentFen,
    pieceStyle,
    boardSize,
    showCoords: showCoordsLocal,
    showCoordinateBorder,
    showThinFrame,
    lightSquare: theme.lightSquare,
    darkSquare: theme.darkSquare,
    flipped: isFlipped,
    pieceImages,
    exportQuality
  };

  function handleExportStart(format) {
    setIsPaused(false);
    setExportState({
      isExporting: true,
      progress: 0,
      currentFormat: format,
      status: 'Preparing'
    });
  }

  function handleExportProgress(progress, format, status) {
    setExportState({
      isExporting: true,
      progress,
      currentFormat: format,
      status: status || ''
    });
  }

  function handleExportFinish() {
    setExportState((prev) => ({
      ...prev,
      isExporting: false,
      progress: 100
    }));
  }

  /**
   * Switches the editor back to the positions tab.
   *
   * @returns {void}
   */
  function handleShowPositionsTab() {
    setActiveTab(TABS.POSITIONS);
  }

  /**
   * Toggles playback for the preview carousel.
   *
   * @returns {void}
   */
  function handleTogglePlay() {
    setIsPlaying((prev) => !prev);
  }

  /**
   * Updates the playback interval and closes the interval menu.
   *
   * @param {number} nextInterval - Selected interval in seconds
   * @returns {void}
   */
  function handleSetInterval(nextInterval) {
    setIntervalTime(nextInterval);
    setShowIntervalMenu(false);
  }

  /**
   * Toggles the interval dropdown menu.
   *
   * @returns {void}
   */
  function handleToggleIntervalMenu() {
    setShowIntervalMenu((prev) => !prev);
  }

  /**
   * Toggles the preview board orientation.
   *
   * @returns {void}
   */
  function handleFlipBoard() {
    setIsFlipped((prev) => !prev);
  }

  /**
   * Applies a FEN edit to the currently selected batch entry.
   *
   * @param {string} newFen - Updated FEN string
   * @returns {void}
   */
  function handleSetFen(newFen) {
    const batchIdx = batchList.indexOf(currentFen);
    if (batchIdx !== -1) {
      updateFen(batchIdx, newFen);
    }
  }

  /**
   * Opens the settings page while preserving the current return context.
   *
   * @returns {void}
   */
  function handleSettingsClick() {
    navigate('/settings', {
      state: {
        returnTo: '/advanced-fen',
        returnTab: activeTab
      }
    });
  }

  /**
   * Forwards control-panel notifications to the local logger.
   *
   * @param {string} message - Notification message
   * @param {string} type - Notification type label
   * @returns {void}
   */
  function handleNotification(message, type) {
    logger.log(`[${type}] ${message}`);
  }

  /**
   * Marks the export progress as paused.
   *
   * @returns {void}
   */
  function handlePauseExport() {
    pauseExport();
    setIsPaused(true);
  }

  /**
   * Resumes a paused export.
   *
   * @returns {void}
   */
  function handleResumeExport() {
    resumeExport();
    setIsPaused(false);
  }

  /**
   * Hides the export progress overlay.
   *
   * @returns {void}
   */
  function handleCancelExportProgress() {
    cancelExport();
    setExportState((prev) => ({
      ...prev,
      isExporting: false
    }));
  }

  /**
   * Closes the export options modal.
   *
   * @returns {void}
   */
  function handleCloseExportModal() {
    setIsExportModalOpen(false);
  }

  return (
    <div className="flex flex-col bg-bg">
      <ToolPageHeader title="Advanced FEN Editor" onBack={handleBack} />
      <div className="flex-shrink-0 bg-surface border-b border-border">
        <div className="px-3 sm:px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max sm:min-w-0">
            {pageTabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${activeTab === id ? 'text-accent border-accent bg-accent/5' : 'text-text-secondary hover:text-text-primary border-transparent hover:bg-surface-hover'}`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-hidden min-h-0">
        <div className="w-full px-[2%] sm:px-[3%] lg:px-[4%] py-[2rem] sm:py-[3rem] transition-all duration-500 ease-in-out">
          {activeTab === TABS.POSITIONS && (
            <PositionsTab
              fens={fens}
              displayFensCount={displayFensCount}
              fenErrors={fenErrors}
              duplicateWarning={duplicateWarning}
              favorites={favorites}
              pastedIndex={pastedIndex}
              onUpdateFen={updateFen}
              onRemoveFen={removeFenInput}
              onToggleFavorite={toggleFavorite}
              onPasteFEN={handlePasteFEN}
            />
          )}

          {activeTab === 'preview-export' && (
            <div className="tab-content">
              {!hasValidFens ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center mb-4">
                    <Eye className="w-8 h-8 text-text-muted" />
                  </div>
                  <p className="text-text-secondary font-medium mb-1">
                    No valid positions to preview
                  </p>
                  <p className="text-text-muted text-sm">
                    Add valid FEN positions in the Positions tab
                  </p>
                  <button
                    onClick={handleShowPositionsTab}
                    className="mt-6 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors"
                  >
                    Go to Positions
                  </button>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-5 w-[95%] max-w-[2400px] mx-auto">
                  <div className="w-[95%] max-w-[2400px] mx-auto">
                    <div className="bg-surface border border-border rounded-xl p-5">
                      <div className="flex flex-col xl:flex-row gap-12">
                        <div className="flex-shrink-0 flex flex-col items-center gap-0">
                          <BoardDisplay
                            boardState={boardState}
                            isFlipped={isFlipped}
                            showCoordinates={showCoordinates}
                            pieceImages={pieceImages}
                            isBoardReady={isBoardReady}
                            lightSquare={theme.lightSquare}
                            darkSquare={theme.darkSquare}
                          />
                          <PlaybackControls
                            isPlaying={isPlaying}
                            interval={interval}
                            showIntervalMenu={showIntervalMenu}
                            intervalOptions={INTERVAL_OPTIONS}
                            currentIndex={safeCurrentIndex}
                            totalCount={validFens.length}
                            onTogglePlay={handleTogglePlay}
                            onSetInterval={handleSetInterval}
                            onToggleIntervalMenu={handleToggleIntervalMenu}
                            onPrevious={handlePrevious}
                            onNext={handleNext}
                          />
                        </div>
                        <QuickActionsPanel
                          isFlipped={isFlipped}
                          currentFen={currentFen}
                          exportConfig={exportConfig}
                          fileName={fileName}
                          validFens={validFens}
                          onFlip={handleFlipBoard}
                          onExportStart={handleExportStart}
                          onExportProgress={handleExportProgress}
                          onExportFinish={handleExportFinish}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-[clamp(360px,30vw,440px)] flex-shrink-0">
                    <ControlPanel
                      fen={currentFen}
                      setFen={handleSetFen}
                      pieceStyle={pieceStyle}
                      setPieceStyle={setPieceStyle}
                      showCoords={showCoordsLocal}
                      setShowCoords={setShowCoordsLocal}
                      showCoordinateBorder={showCoordinateBorder}
                      setShowCoordinateBorder={setShowCoordinateBorder}
                      showThinFrame={showThinFrame}
                      setShowThinFrame={setShowThinFrame}
                      exportQuality={exportQuality}
                      showAdvancedButton={false}
                      showHistoryButton={false}
                      onSettingsClick={handleSettingsClick}
                      onNotification={handleNotification}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {exportState.isExporting && (
        <ExportProgress
          isExporting={exportState.isExporting}
          progress={exportState.progress}
          currentFormat={exportState.currentFormat}
          statusText={exportState.status}
          config={exportConfig}
          isPaused={isPaused}
          onPause={handlePauseExport}
          onResume={handleResumeExport}
          onCancel={handleCancelExportProgress}
        />
      )}

      {isExportModalOpen && (
        <ExportOptionsDialog
          isOpen={isExportModalOpen}
          onClose={handleCloseExportModal}
          fileName={fileName}
          setFileName={setFileName}
          exportQuality={exportQuality}
          setExportQuality={setExportQuality}
        />
      )}
    </div>
  );
});
AdvancedFENInputPage.displayName = 'AdvancedFENInputPage';
export default AdvancedFENInputPage;
