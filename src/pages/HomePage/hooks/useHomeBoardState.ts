import { useEffect } from 'react';

import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { useSyncedBoardColors } from '@/shared/hooks/useTheme';
import { normalizeExportQuality } from '@/shared/utils/imageOptimizer';

import {
  MAX_POSITION_LENGTH,
  validateFEN,
  isFairyFEN
} from '@/shared/utils/fenParser';

export function useHomeBoardState(variant: 'standard' | 'fairy' = 'standard') {
  const [fen, setFen] = useLocalStorage<string>(
    variant === 'fairy' ? 'fairy-position' : 'chess-fen',
    variant === 'fairy'
      ? '8/8/8/8/8/8/8/8 w - - 0 1'
      : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  );

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const shared =
      new URLSearchParams(window.location.search).get('fen') ??
      fragment.get('position');
    if (!shared) return;
    if (variant === 'standard' && isFairyFEN(shared)) {
      window.location.replace(
        `/fairy-chess#position=${encodeURIComponent(shared)}`
      );
      return;
    }
    if (shared.length <= MAX_POSITION_LENGTH && validateFEN(shared)) {
      setFen(shared);
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('fen');
    if (fragment.has('position')) url.hash = '';
    window.history.replaceState({}, document.title, url.toString());
  }, [setFen, variant]);

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
  const [storedExportQuality, setExportQuality] = useLocalStorage<number>(
    'chess-export-quality',
    2
  );
  const exportQuality = normalizeExportQuality(storedExportQuality);

  return {
    fen:
      variant === 'standard' && isFairyFEN(fen)
        ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
        : fen,
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
