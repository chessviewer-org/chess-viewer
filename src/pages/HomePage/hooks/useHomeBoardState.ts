import { useEffect } from 'react';

import { useLocalStorage, useSyncedBoardColors } from '@hooks';

import { MAX_FEN_LENGTH, validateFEN } from '@utils';

export function useHomeBoardState() {
  const [fen, setFen] = useLocalStorage<string>(
    'chess-fen',
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  );

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get('fen');
    if (!shared) return;
    if (shared.length <= MAX_FEN_LENGTH && validateFEN(shared)) {
      setFen(shared);
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('fen');
    window.history.replaceState({}, document.title, url.toString());
  }, [setFen]);

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

  useSyncedBoardColors(setLightSquare, setDarkSquare);

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
