import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFENHistory, useLocalStorage, useNotifications } from '@hooks';
import {
  cancelExport,
  copyToClipboard,
  downloadJPEG,
  downloadPNG,
  pauseExport,
  resumeExport,
  shouldForceCoordinateBorder,
  validateFEN
} from '@utils';
import { safeJSONParse } from '@utils/validation';

export interface ExportState {
  isExporting: boolean;
  exportProgress: number;
  currentFormat: string | null;
  isPaused: boolean;
  showProgress: boolean;
}

interface BatchExportOverrides {
  boardSize?: number;
  exportQuality?: number;
}

export type ExportAction =
  | { type: 'START_EXPORT'; format: string }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'COMPLETE' }
  | { type: 'TOGGLE_PROGRESS' };

const exportReducer = (state: ExportState, action: ExportAction): ExportState => {
  switch (action.type) {
    case 'START_EXPORT':
      return {
        ...state,
        isExporting: true,
        currentFormat: action.format,
        exportProgress: 0,
        isPaused: false,
        showProgress: true
      };
    case 'UPDATE_PROGRESS':
      return { ...state, exportProgress: action.progress };
    case 'PAUSE':
      return { ...state, isPaused: true };
    case 'RESUME':
      return { ...state, isPaused: false };
    case 'COMPLETE':
      return {
        ...state,
        isExporting: false,
        currentFormat: null,
        exportProgress: 0,
        isPaused: false
      };
    case 'TOGGLE_PROGRESS':
      return { ...state, showProgress: !state.showProgress };
    default:
      return state;
  }
};

export const useHome = () => {
  const location = useLocation();

  const [fen, setFen] = useLocalStorage<string>(
    'chess-fen',
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  );

  useEffect(() => {
    if (location.state?.loadFEN) {
      setFen(location.state.loadFEN);
      window.history.replaceState({}, document.title);
    }
  }, [location, setFen]);

  const [pieceStyle, setPieceStyle] = useLocalStorage<string>(
    'chess-piece-style',
    'cburnett'
  );
  const [showCoords, setShowCoords] = useLocalStorage<boolean>(
    'chess-show-coords',
    true
  );
  const [showCoordinateBorder, setShowCoordinateBorder] = useLocalStorage<boolean>(
    'chess-show-coordinate-border',
    true
  );
  const [showThinFrame, setShowThinFrame] = useLocalStorage<boolean>(
    'chess-show-thin-frame',
    false
  );
  const [lightSquare, setLightSquare] = useLocalStorage<string>(
    'chess-light-square',
    '#f0d9b5'
  );
  const [darkSquare, setDarkSquare] = useLocalStorage<string>(
    'chess-dark-square',
    '#b58863'
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const light = localStorage.getItem('chess-light-square');
      const dark = localStorage.getItem('chess-dark-square');

      if (light !== null) {
        setLightSquare(safeJSONParse(light, '#f0d9b5'));
      }
      if (dark !== null) {
        setDarkSquare(safeJSONParse(dark, '#b58863'));
      }
    };

    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleStorageChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setLightSquare, setDarkSquare]);
  
  const [boardSize, setBoardSize] = useLocalStorage<number>('chess-board-size', 4);
  const [flipped, setFlipped] = useLocalStorage<boolean>('chess-flipped', false);
  const [fileName, setFileName] = useLocalStorage<string>('chess-file-name', 'chess-position');
  const [exportQuality, setExportQuality] = useLocalStorage<number>('chess-export-quality', 16);

  const [exportState, dispatchExport] = useReducer(exportReducer, {
    isExporting: false,
    exportProgress: 0,
    currentFormat: null,
    isPaused: false,
    showProgress: true
  });

  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const {
    saveManualFen,
    saveExportFen,
    notifyDragAction,
    addCurrentToFavorites
  } = useFENHistory(fen, setIsFavorite);

  const addToFavoritesRef = useRef<(() => void) | null>(null);
  const pieceImagesRef = useRef<Record<string, HTMLImageElement>>({});
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, []);

  const scheduleComplete = useCallback(() => {
    if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    completeTimerRef.current = setTimeout(() => {
      dispatchExport({ type: 'COMPLETE' });
      completeTimerRef.current = null;
    }, 300);
  }, []);

  const handlePieceImagesChange = useCallback((images: Record<string, HTMLImageElement>) => {
    pieceImagesRef.current = images;
  }, []);

  const { notifications, success, error, info, warning, removeNotification } =
    useNotifications();

  const getExportConfig = useCallback((overrides?: BatchExportOverrides) => {
    const effectiveExportQuality = overrides?.exportQuality ?? exportQuality;
    const effectiveBoardSize = overrides?.boardSize ?? boardSize;
    const forceCoordBorder = shouldForceCoordinateBorder(effectiveExportQuality);
    const effectiveCoordBorder = forceCoordBorder || showCoordinateBorder;

    return {
      boardSize: effectiveBoardSize,
      showCoords,
      showCoordinateBorder: effectiveCoordBorder,
      showThinFrame: showThinFrame,
      lightSquare,
      darkSquare,
      flipped,
      fen,
      pieceImages: pieceImagesRef.current,
      exportQuality: effectiveExportQuality
    };
  }, [
    boardSize,
    showCoords,
    showCoordinateBorder,
    showThinFrame,
    lightSquare,
    darkSquare,
    flipped,
    fen,
    exportQuality
  ]);

  const handleDownloadPNG = useCallback(async () => {
    if (!validateFEN(fen)) {
      error('Invalid FEN — cannot export');
      return;
    }
    dispatchExport({ type: 'START_EXPORT', format: 'png' });
    saveExportFen(fen);

    try {
      await downloadPNG(getExportConfig(), fileName, (progress: number) => {
        dispatchExport({ type: 'UPDATE_PROGRESS', progress });
      });
      success('PNG exported successfully');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Export cancelled') {
        info('Export cancelled');
      } else {
        error('PNG export failed: ' + (err instanceof Error ? err.message : String(err)));
      }
    } finally {
      scheduleComplete();
    }
  }, [getExportConfig, fileName, fen, saveExportFen, success, error, info, scheduleComplete]);

  const handleDownloadJPEG = useCallback(async () => {
    if (!validateFEN(fen)) {
      error('Invalid FEN — cannot export');
      return;
    }
    dispatchExport({ type: 'START_EXPORT', format: 'jpeg' });
    saveExportFen(fen);

    try {
      await downloadJPEG(getExportConfig(), fileName, (progress: number) => {
        dispatchExport({ type: 'UPDATE_PROGRESS', progress });
      });
      success('JPEG exported successfully');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'Export cancelled') {
        info('Export cancelled');
      } else {
        error('JPEG export failed: ' + (err instanceof Error ? err.message : String(err)));
      }
    } finally {
      scheduleComplete();
    }
  }, [getExportConfig, fileName, fen, saveExportFen, success, error, info, scheduleComplete]);

  const handleCopyImage = useCallback(async () => {
    if (!validateFEN(fen)) {
      error('Invalid FEN — cannot export');
      return;
    }
    try {
      await copyToClipboard(getExportConfig());
      saveExportFen(fen);
      success('Image copied to clipboard');
    } catch (err: unknown) {
      error('Copy failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [getExportConfig, fen, saveExportFen, success, error]);

  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
    success('Board flipped');
  }, [setFlipped, success]);

  const handleBatchExport = useCallback(
    async (
      formats: string[],
      customFileNames?: string | string[],
      overrides?: BatchExportOverrides
    ) => {
      const firstFormat = formats[0] ?? 'png';
      dispatchExport({ type: 'START_EXPORT', format: firstFormat });
      saveExportFen(fen);

      try {
        const total = formats.length;
        for (let i = 0; i < total; i++) {
          const format = formats[i];
          if (!format) continue;
          
          const currentFileName = Array.isArray(customFileNames) 
            ? (customFileNames[i] || fileName) 
            : (customFileNames || fileName);

          const baseProgress = (i / total) * 100;
          const updateProgress = (p: number) => {
            dispatchExport({ type: 'UPDATE_PROGRESS', progress: baseProgress + p / total });
          };

          dispatchExport({ type: 'START_EXPORT', format });

          if (format === 'png') {
            await downloadPNG(getExportConfig(overrides), currentFileName, updateProgress);
          } else if (format === 'jpeg') {
            await downloadJPEG(getExportConfig(overrides), currentFileName, updateProgress);
          } else if (format === 'svg') {
            const { downloadSVG } = await import('@utils/svgExporter');
            await downloadSVG(getExportConfig(overrides), currentFileName, updateProgress);
          }
        }
        success(`Exported ${formats.length} formats successfully`);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'Export cancelled') {
          info('Export cancelled');
        } else {
          error('Batch export failed: ' + (err instanceof Error ? err.message : String(err)));
        }
      } finally {
        scheduleComplete();
      }
    },
    [
      getExportConfig,
      fileName,
      fen,
      saveExportFen,
      success,
      error,
      info,
      scheduleComplete
    ]
  );

  const handleCancelExport = useCallback(() => {
    cancelExport();
    dispatchExport({ type: 'COMPLETE' });
    info('Export cancelled');
  }, [info]);

  const handlePause = useCallback(() => {
    pauseExport();
    dispatchExport({ type: 'PAUSE' });
  }, []);

  const handleResume = useCallback(() => {
    resumeExport();
    dispatchExport({ type: 'RESUME' });
  }, []);

  const handleAddToFavorites = useCallback(() => {
    if (addToFavoritesRef.current) {
      addToFavoritesRef.current();
    }
  }, []);

  const handleEditorFenChange = useCallback(
    (newFen: string) => {
      setFen(newFen);
      notifyDragAction();
    },
    [setFen, notifyDragAction]
  );

  const handleNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      if (type === 'success') success(message);
      else if (type === 'error') error(message);
      else if (type === 'warning') warning(message);
      else info(message);
    },
    [success, error, warning, info]
  );
  
  const toggleProgress = useCallback(() => {
    dispatchExport({ type: 'TOGGLE_PROGRESS' });
  }, []);

  return useMemo(
    () => ({
      fen,
      setFen,
      pieceStyle,
      setPieceStyle,
      showCoords,
      setShowCoords,
      showCoordinateBorder,
      setShowCoordinateBorder,
      showThinFrame,
      setShowThinFrame,
      lightSquare,
      setLightSquare,
      darkSquare,
      setDarkSquare,
      boardSize,
      setBoardSize,
      exportQuality,
      setExportQuality,
      fileName,
      setFileName,
      flipped,
      isFavorite,
      setIsFavorite,
      addToFavoritesRef,
      exportState,
      notifications,
      removeNotification,

      saveManualFen,
      saveExportFen,
      addCurrentToFavorites,

      handlePieceImagesChange,
      handleDownloadPNG,
      handleDownloadJPEG,
      handleCopyImage,
      handleFlip,
      handleBatchExport,
      handleCancelExport,
      handlePause,
      handleResume,
      handleAddToFavorites,
      handleEditorFenChange,
      handleNotification,
      toggleProgress,
      getExportConfig
    }),
    [
      fen, setFen, pieceStyle, setPieceStyle, showCoords, setShowCoords,
      showCoordinateBorder, setShowCoordinateBorder, showThinFrame, setShowThinFrame,
      lightSquare, setLightSquare, darkSquare, setDarkSquare, boardSize, setBoardSize,
      exportQuality, setExportQuality, fileName, setFileName, flipped, isFavorite,
      exportState, notifications, removeNotification, saveManualFen, saveExportFen,
      addCurrentToFavorites, handlePieceImagesChange, handleDownloadPNG, handleDownloadJPEG,
      handleCopyImage, handleFlip, handleBatchExport, handleCancelExport, handlePause,
      handleResume, handleAddToFavorites, handleEditorFenChange, handleNotification,
      toggleProgress, getExportConfig
    ]
  );
};
