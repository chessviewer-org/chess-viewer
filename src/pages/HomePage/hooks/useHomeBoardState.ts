import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

import { useLocalStorage } from '@hooks';

import { safeJSONParse } from '@utils/validation';

/** Persists all board display settings to localStorage and syncs square colors on cross-tab storage events. */
export function useHomeBoardState() {
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
  const [showCoordinateBorder, setShowCoordinateBorder] =
    useLocalStorage<boolean>('chess-show-coordinate-border', true);
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
      if (light !== null) setLightSquare(safeJSONParse(light, '#f0d9b5'));
      if (dark !== null) setDarkSquare(safeJSONParse(dark, '#b58863'));
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') handleStorageChange();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [setLightSquare, setDarkSquare]);

  const [boardSize, setBoardSize] = useLocalStorage<number>(
    'chess-board-size',
    4
  );
  const [flipped, setFlipped] = useLocalStorage<boolean>(
    'chess-flipped',
    false
  );
  const [fileName, setFileName] = useLocalStorage<string>(
    'chess-file-name',
    'chess-position'
  );
  const [exportQuality, setExportQuality] = useLocalStorage<number>(
    'chess-export-quality',
    16
  );

  return {
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
    flipped,
    setFlipped,
    fileName,
    setFileName,
    exportQuality,
    setExportQuality
  };
}
