import { useCallback, useMemo, useRef, useState } from 'react';

import { useFENHistory, useNotifications } from '@hooks';

import { useHomeBoardState } from './useHomeBoardState';
import { useHomeExport } from './useHomeExport';

export type { ExportAction, ExportState } from './useHomeExport';

/** Aggregates board state, FEN history, export actions, and notifications for HomePage. */
export const useHome = () => {
  const board = useHomeBoardState();

  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const {
    saveManualFen,
    saveExportFen,
    notifyDragAction,
    addCurrentToFavorites
  } = useFENHistory(board.fen, setIsFavorite);

  const addToFavoritesRef = useRef<(() => void) | null>(null);

  const { notifications, success, error, info, warning, removeNotification } =
    useNotifications();

  const exportApi = useHomeExport({
    fen: board.fen,
    fileName: board.fileName,
    boardSize: board.boardSize,
    exportQuality: board.exportQuality,
    showCoords: board.showCoords,
    showCoordinateBorder: board.showCoordinateBorder,
    showThinFrame: board.showThinFrame,
    lightSquare: board.lightSquare,
    darkSquare: board.darkSquare,
    flipped: board.flipped,
    saveExportFen,
    notify: { success, error, info }
  });

  const handleFlip = useCallback(() => {
    board.setFlipped((prev) => !prev);
    success('Board flipped');
  }, [board, success]);

  const handleAddToFavorites = useCallback(() => {
    addToFavoritesRef.current?.();
  }, []);

  const handleEditorFenChange = useCallback(
    (newFen: string) => {
      board.setFen(newFen);
      notifyDragAction();
    },
    [board, notifyDragAction]
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

  return useMemo(
    () => ({
      ...board,
      isFavorite,
      setIsFavorite,
      addToFavoritesRef,
      exportState: exportApi.exportState,
      notifications,
      removeNotification,

      saveManualFen,
      saveExportFen,
      addCurrentToFavorites,

      handlePieceImagesChange: exportApi.handlePieceImagesChange,
      handleDownloadPNG: exportApi.handleDownloadPNG,
      handleDownloadJPEG: exportApi.handleDownloadJPEG,
      handleCopyImage: exportApi.handleCopyImage,
      handleFlip,
      handleBatchExport: exportApi.handleBatchExport,
      handleCancelExport: exportApi.handleCancelExport,
      handlePause: exportApi.handlePause,
      handleResume: exportApi.handleResume,
      handleAddToFavorites,
      handleEditorFenChange,
      handleNotification,
      toggleProgress: exportApi.toggleProgress,
      getExportConfig: exportApi.getExportConfig
    }),
    [
      board,
      isFavorite,
      exportApi,
      notifications,
      removeNotification,
      saveManualFen,
      saveExportFen,
      addCurrentToFavorites,
      handleFlip,
      handleAddToFavorites,
      handleEditorFenChange,
      handleNotification
    ]
  );
};
