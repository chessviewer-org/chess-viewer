import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ADVANCED_FEN_CONFIG } from '@constants';
import { useFENBatch } from '@/contexts';
import { useChessBoard, usePieceImages, useTheme } from '@hooks';
import {
  cancelExport,
  getFENValidationError,
  logger,
  pauseExport,
  resumeExport,
  validateFEN,
  downloadPNG,
  downloadJPEG,
  downloadSVG
} from '@utils';
import { MAX_FEN_LENGTH, safeJSONParse } from '@utils/validation';

const {
  MAX_FENS,
  DEFAULT_FENS,
  DEFAULT_INTERVAL,
  TABS,
  STORAGE_KEYS
} = ADVANCED_FEN_CONFIG;

export interface AdvancedFENInitialProps {
  pieceStyle?: string;
  boardSize?: number;
  fileName?: string;
  exportQuality?: number;
  showCoords?: boolean;
  showCoordinateBorder?: boolean;
  showThinFrame?: boolean;
  lightSquare?: string;
  darkSquare?: string;
}

export interface ExportState {
  isExporting: boolean;
  progress: number;
  currentFormat: string;
  status: string;
}

export interface PositionSettings {
  [fen: string]: {
    pieceStyle?: string;
    boardSize?: number;
    fileName?: string;
    exportQuality?: number;
    showCoords?: boolean;
    showCoordinateBorder?: boolean;
    showThinFrame?: boolean;
    isFlipped?: boolean;
    showCoordinates?: boolean;
    lightSquare?: string;
    darkSquare?: string;
    exportFormat?: 'png' | 'jpeg' | 'svg';
  };
}

/**
 * Parses smart naming ranges like Siciliya[1-4], İspan[5-6] to allocate position names.
 *
 * @param input - Raw naming input
 * @param totalCount - Number of valid board positions
 * @returns Array of parsed names mapped by index
 */
export function parseSmartNaming(input: string, totalCount: number): string[] {
  const names = Array(totalCount).fill('');
  if (!input.trim()) return names;

  const tokens = input.split(',').map((t) => t.trim());
  let hasCustomMappings = false;

  for (const token of tokens) {
    const match = token.match(/^([^\[]+)\[(\d+)-(\d+)\]$/);
    if (match) {
      hasCustomMappings = true;
      const baseName = (match[1] || '').trim();
      const start = parseInt(match[2] || '0', 10);
      const end = parseInt(match[3] || '0', 10);

      const rangeStart = Math.min(start, end);
      const rangeEnd = Math.max(start, end);

      let counter = 1;
      for (let i = rangeStart; i <= rangeEnd; i++) {
        if (i >= 1 && i <= totalCount) {
          names[i - 1] = `${baseName}-${counter}`;
          counter++;
        }
      }
    }
  }

  if (!hasCustomMappings) {
    const baseName = input.trim();
    for (let i = 0; i < totalCount; i++) {
      names[i] = `${baseName}-${i + 1}`;
    }
  } else {
    for (let i = 0; i < totalCount; i++) {
      if (!names[i]) {
        names[i] = `Position-${i + 1}`;
      }
    }
  }

  return names;
}

export function useAdvancedFEN(props: AdvancedFENInitialProps = {}) {
  const {
    pieceStyle: initialPieceStyle = 'cburnett',
    boardSize: initialBoardSize = 480,
    fileName: initialFileName = 'chess-board',
    exportQuality: initialExportQuality = 16,
    showCoords: initialShowCoords = true,
    showCoordinateBorder: initialShowCoordinateBorder = true,
    showThinFrame: initialShowThinFrame = false,
    lightSquare: initialLightSquare = '#f0d9b5',
    darkSquare: initialDarkSquare = '#b58863'
  } = props;

  const navigate = useNavigate();
  const location = useLocation();
  const { batchList, removeFromBatch, updateBatchItem, addToBatch } = useFENBatch();

  const duplicateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pastedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addedFenRef = useRef(false);
  const isSyncingRef = useRef(false);
  
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

  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return safeJSONParse(saved, {} as Record<string, boolean>);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalTime, setIntervalTime] = useState(DEFAULT_INTERVAL);
  const [showIntervalMenu, setShowIntervalMenu] = useState(false);
  const [pastedIndex, setPastedIndex] = useState<number | null>(null);
  const [fenErrors, setFenErrors] = useState<Record<number, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>(TABS.POSITIONS);

  const [positionSettings, setPositionSettings] = useState<PositionSettings>(() => {
    const saved = localStorage.getItem('advanced-fen-position-settings');
    return safeJSONParse(saved, {} as PositionSettings);
  });

  // Wizard and Export settings states
  const [wizardStep, setWizardStep] = useState<1 | 2>(1);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  const [isChained, setIsChained] = useState(true);
  const [smartNamingInput, setSmartNamingInput] = useState('Chessboard');

  const [isFlipped, setIsFlipped] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [pieceStyle, setPieceStyle] = useState(initialPieceStyle);
  const [boardSize, setBoardSize] = useState(initialBoardSize);
  const [fileName, setFileName] = useState(initialFileName);
  const [exportQuality, setExportQuality] = useState(initialExportQuality);
  const [showCoordsLocal, setShowCoordsLocal] = useState(initialShowCoords);
  const [showCoordinateBorder, setShowCoordinateBorder] = useState(initialShowCoordinateBorder);
  const [showThinFrame, setShowThinFrame] = useState(initialShowThinFrame);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
    progress: 0,
    currentFormat: '',
    status: ''
  });
  const [isPaused, setIsPaused] = useState(false);

  const {
    lightSquare,
    darkSquare,
    setLightSquare,
    setDarkSquare
  } = useTheme({
    initialLight: initialLightSquare,
    initialDark: initialDarkSquare
  });

  const themePayload = useMemo(() => ({
    lightSquare,
    darkSquare,
    setLightSquare,
    setDarkSquare
  }), [lightSquare, darkSquare, setLightSquare, setDarkSquare]);

  const validFens = fens.filter((f) => f.trim() && validateFEN(f));
  const hasValidFens = validFens.length > 0;
  const displayFensCount = Math.max(batchList.length, 3);
  const safeCurrentIndex = Math.min(
    currentIndex,
    Math.max(0, validFens.length - 1)
  );
  const currentFen = hasValidFens ? (validFens[safeCurrentIndex] ?? '') : '';
  const renderFen = currentFen || (DEFAULT_FENS[0] ?? '');

  const { board: boardState } = useChessBoard(renderFen);
  const { pieceImages, isLoading: imagesLoading } = usePieceImages(pieceStyle);
  const isBoardReady =
    Array.isArray(boardState) &&
    boardState.length === 8 &&
    !imagesLoading &&
    pieceImages &&
    Object.keys(pieceImages).length > 0;

  // Smart naming calculations
  const parsedNames = useMemo(() => {
    return parseSmartNaming(smartNamingInput, validFens.length);
  }, [smartNamingInput, validFens.length]);

  const activeFileName = useMemo(() => {
    return parsedNames[safeCurrentIndex] || `${fileName}-${safeCurrentIndex + 1}`;
  }, [parsedNames, safeCurrentIndex, fileName]);

  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    const restoreTab = state?.['restoreTab'] as string | undefined;
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

  // Decoupled settings reader sync logic
  useEffect(() => {
    const initialSettings = initialSettingsRef.current;
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (currentFen) {
      isSyncingRef.current = true;
      const settings = positionSettings[currentFen];
      
      // If chained, we ignore position-specific configs to preserve global sync
      if (!isChained && settings) {
        setPieceStyle(settings.pieceStyle ?? initialSettings.pieceStyle);
        setBoardSize(settings.boardSize ?? initialSettings.boardSize);
        setFileName(settings.fileName ?? initialSettings.fileName);
        setExportQuality(settings.exportQuality ?? initialSettings.exportQuality);
        setShowCoordsLocal(settings.showCoords ?? initialSettings.showCoords);
        setShowCoordinateBorder(settings.showCoordinateBorder ?? initialSettings.showCoordinateBorder);
        setShowThinFrame(settings.showThinFrame ?? initialSettings.showThinFrame);
        setIsFlipped(settings.isFlipped ?? false);
        setShowCoordinates(settings.showCoordinates ?? true);
        if (settings.lightSquare && settings.darkSquare) {
          setLightSquare(settings.lightSquare);
          setDarkSquare(settings.darkSquare);
        }
        if (settings.exportFormat) {
          setExportFormat(settings.exportFormat);
        }
      } else if (!isChained) {
        setPieceStyle(initialSettings.pieceStyle);
        setBoardSize(initialSettings.boardSize);
        setFileName(initialSettings.fileName);
        setExportQuality(initialSettings.exportQuality);
        setShowCoordsLocal(initialSettings.showCoords);
        setShowCoordinateBorder(initialSettings.showCoordinateBorder);
        setIsFlipped(false);
        setShowCoordinates(true);
        setLightSquare(initialSettings.lightSquare);
        setDarkSquare(initialSettings.darkSquare);
        setExportFormat('png');
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
  }, [currentFen, currentIndex, isChained, positionSettings, setLightSquare, setDarkSquare]);

  // Decoupled settings writer sync logic with strict checking
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

  useEffect(() => {
    const errors: Record<number, string> = {};
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
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying && validFens.length > 0) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % validFens.length);
      }, intervalTime * 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, intervalTime, validFens.length]);

  useEffect(() => {
    return () => {
      if (duplicateTimeoutRef.current) clearTimeout(duplicateTimeoutRef.current);
      if (pastedTimeoutRef.current) clearTimeout(pastedTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (state?.['addFen'] && !addedFenRef.current) {
      const rawFenToAdd = state['addFen'] as string;
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

  const removeFenInput = useCallback((index: number) => {
    if (index < batchList.length) {
      removeFromBatch(index);
      if (currentIndex >= batchList.length - 1) {
        setCurrentIndex(Math.max(0, batchList.length - 2));
      }
      const fenToRemove = batchList[index];
      if (fenToRemove) {
        setFavorites((prev) => {
          const newFavorites = { ...prev };
          delete newFavorites[fenToRemove];
          return newFavorites;
        });
      }
    }
  }, [batchList, removeFromBatch, currentIndex]);

  const updateFen = useCallback((index: number, value: string) => {
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
  }, [batchList, updateBatchItem, addToBatch]);

  const handlePasteFEN = useCallback(async (index: number) => {
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
  }, [updateFen]);

  const toggleFavorite = useCallback((fen: string) => {
    if (!fen || !validateFEN(fen)) return;
    setFavorites((prev) => ({
      ...prev,
      [fen]: !prev[fen]
    }));
  }, []);

  const handlePrevious = useCallback(() => {
    if (validFens.length > 0)
      setCurrentIndex((prev) => (prev - 1 + validFens.length) % validFens.length);
  }, [validFens.length]);

  const handleNext = useCallback(() => {
    if (validFens.length > 0)
      setCurrentIndex((prev) => (prev + 1) % validFens.length);
  }, [validFens.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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

  const exportConfig = useMemo(() => ({
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
  }), [
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
  ]);

  const handleExportStart = useCallback((format: string) => {
    setIsPaused(false);
    setExportState({
      isExporting: true,
      progress: 0,
      currentFormat: format,
      status: 'Preparing'
    });
  }, []);

  const handleExportProgress = useCallback((
    progress: number,
    format: string,
    status?: string
  ) => {
    setExportState({
      isExporting: true,
      progress,
      currentFormat: format,
      status: status || ''
    });
  }, []);

  const handleExportFinish = useCallback(() => {
    setExportState((prev) => ({
      ...prev,
      isExporting: false,
      progress: 100
    }));
  }, []);

  const handleShowPositionsTab = useCallback(() => {
    setActiveTab(TABS.POSITIONS);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSetIntervalTime = useCallback((nextInterval: number) => {
    setIntervalTime(nextInterval);
    setShowIntervalMenu(false);
  }, []);

  const handleToggleIntervalMenu = useCallback(() => {
    setShowIntervalMenu((prev) => !prev);
  }, []);

  const handleFlipBoard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleSetFen = useCallback((newFen: string) => {
    if (!currentFen) return;
    const batchIdx = batchList.indexOf(currentFen);
    if (batchIdx !== -1) {
      updateFen(batchIdx, newFen);
    }
  }, [batchList, currentFen, updateFen]);

  const handleSettingsClick = useCallback(() => {
    navigate('/settings', {
      state: {
        returnTo: '/advanced-fen',
        returnTab: activeTab
      }
    });
  }, [navigate, activeTab]);

  const handleNotification = useCallback((message: string, type: string) => {
    logger.log(`[${type}] ${message}`);
  }, []);

  const handlePauseExport = useCallback(() => {
    pauseExport();
    setIsPaused(true);
  }, []);

  const handleResumeExport = useCallback(() => {
    resumeExport();
    setIsPaused(false);
  }, []);

  const handleCancelExportProgress = useCallback(() => {
    cancelExport();
    setExportState((prev) => ({
      ...prev,
      isExporting: false
    }));
  }, []);

  const handleCloseExportModal = useCallback(() => {
    setIsExportModalOpen(false);
  }, []);

  const handleSetFileName = useCallback((name: string) => {
    setFileName(name);
  }, []);

  const handleSetExportQuality = useCallback((quality: number) => {
    if (isChained && safeCurrentIndex > 0) {
      setIsChained(false);
    }
    setExportQuality(quality);
  }, [isChained, safeCurrentIndex]);

  const handleSetPieceStyle = useCallback((style: string) => {
    if (isChained && safeCurrentIndex > 0) {
      setIsChained(false);
    }
    setPieceStyle(style);
  }, [isChained, safeCurrentIndex]);

  const handleSetShowCoordsLocal = useCallback((show: boolean) => {
    setShowCoordsLocal(show);
  }, []);

  const handleSetShowCoordinateBorder = useCallback((show: boolean) => {
    setShowCoordinateBorder(show);
  }, []);

  const handleSetShowThinFrame = useCallback((show: boolean) => {
    setShowThinFrame(show);
  }, []);

  const handleSetExportFormat = useCallback((format: 'png' | 'jpeg' | 'svg') => {
    if (isChained && safeCurrentIndex > 0) {
      setIsChained(false);
    }
    setExportFormat(format);
  }, [isChained, safeCurrentIndex]);

  const handleApplyPresetTheme = useCallback((light: string, dark: string) => {
    if (isChained && safeCurrentIndex > 0) {
      setIsChained(false);
    }
    setLightSquare(light);
    setDarkSquare(dark);
  }, [isChained, safeCurrentIndex, setLightSquare, setDarkSquare]);

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
    exportFormat
  ]);

  // Export executers
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
    } catch (err) {
      logger.error('Active export failed:', err);
    } finally {
      handleExportFinish();
    }
  }, [exportFormat, activeFileName, exportConfig, handleExportStart, handleExportProgress, handleExportFinish]);

  const handleExportBatch = useCallback(async () => {
    try {
      handleExportStart(exportFormat);
      
      for (let i = 0; i < validFens.length; i++) {
        const fen = validFens[i];
        if (!fen) continue;

        const settings = positionSettings[fen] || {};
        const activeStyle = isChained ? pieceStyle : (settings.pieceStyle ?? pieceStyle);
        const activeQuality = isChained ? exportQuality : (settings.exportQuality ?? exportQuality);
        const activeLight = isChained ? lightSquare : (settings.lightSquare ?? lightSquare);
        const activeDark = isChained ? darkSquare : (settings.darkSquare ?? darkSquare);
        const activeFlipped = isChained ? isFlipped : (settings.isFlipped ?? isFlipped);
        const activeShowCoords = isChained ? showCoordsLocal : (settings.showCoords ?? showCoordsLocal);
        const activeShowBorder = isChained ? showCoordinateBorder : (settings.showCoordinateBorder ?? showCoordinateBorder);
        const activeShowFrame = isChained ? showThinFrame : (settings.showThinFrame ?? showThinFrame);
        const format = isChained ? exportFormat : (settings.exportFormat ?? exportFormat);

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
          handleExportProgress(totalProgress, format, `${i + 1}/${validFens.length}`);
        };

        if (format === 'png') {
          await downloadPNG(config, numberedName, reportProgress);
        } else if (format === 'jpeg') {
          await downloadJPEG(config, numberedName, reportProgress);
        } else if (format === 'svg') {
          await downloadSVG(config, numberedName, reportProgress);
        }
      }
    } catch (err) {
      logger.error('Batch export failed:', err);
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
      fileName,
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
      
      // Wizard & Split-Screen Studio additions
      wizardStep,
      exportFormat,
      isChained,
      smartNamingInput,
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
      setFileName: handleSetFileName,
      setExportQuality: handleSetExportQuality,
      setPieceStyle: handleSetPieceStyle,
      setShowCoordsLocal: handleSetShowCoordsLocal,
      setShowCoordinateBorder: handleSetShowCoordinateBorder,
      setShowThinFrame: handleSetShowThinFrame,

      // Wizard additions
      setWizardStep,
      setExportFormat: handleSetExportFormat,
      setIsChained,
      setSmartNamingInput,
      handleApplyPresetTheme,
      handleApplyToAll,
      handleExportActive,
      handleExportBatch
    }
  };
}
