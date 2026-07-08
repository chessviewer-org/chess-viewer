import { useRef, useState } from 'react';

import { useFENHistory, useHomeExport, useNotifications } from '@/shared/hooks';

import { useHomeBoardState } from './useHomeBoardState';

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

  function handleFlip() {
    board.setFlipped((prev) => !prev);
    success('Board flipped');
  }

  function handleEditorFenChange(newFen: string) {
    board.setFen(newFen);
    notifyDragAction();
  }

  function handleNotification(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info'
  ) {
    if (type === 'success') success(message);
    else if (type === 'error') error(message);
    else if (type === 'warning') warning(message);
    else info(message);
  }

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
