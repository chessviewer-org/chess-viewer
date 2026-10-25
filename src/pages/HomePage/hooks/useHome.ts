import { useCallback, useRef, useState } from 'react';

import { useFENHistory } from '@/shared/hooks/useFENHistory';
import { useHomeExport } from '@/shared/hooks/useHomeExport';
import { useNotifications } from '@/shared/hooks/useNotifications';

import { useHomeBoardState } from './useHomeBoardState';

export const useHome = (variant: 'standard' | 'fairy' = 'standard') => {
  // State
  const board = useHomeBoardState(variant);

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
    pieceStyle: board.pieceStyle,
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
    notify: { error, info, warning }
  });

  // Handlers
  const { setFlipped, setFen } = board;
  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev);
  }, [setFlipped]);

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

  return {
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
    handleCopyImage: exportApi.handleCopyImage,
    handleFlip,
    handleCancelExport: exportApi.handleCancelExport,
    handlePause: exportApi.handlePause,
    handleResume: exportApi.handleResume,
    handleEditorFenChange,
    handleNotification,
    toggleProgress: exportApi.toggleProgress,
    getExportConfig: exportApi.getExportConfig
  };
};
