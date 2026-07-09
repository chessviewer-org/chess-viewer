import { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  AVAILABLE_PIECE_SETS,
  hydrateFromSync,
  logger,
  sortPieceSets,
  type PieceSort
} from '@utils';
import { syncStorage } from '@/auth';
import { useLocalStorage } from './useLocalStorage';

export function usePieceSort() {
  const [pieceSort, setPieceSort] = useLocalStorage<PieceSort>(
    'cv_piece_sort',
    'popular'
  );
  const sortedPieceSets = useMemo(() => sortPieceSets(pieceSort), [pieceSort]);
  return { pieceSort, setPieceSort, sortedPieceSets };
}

const PIECE_STYLE_KEY = 'chess-piece-style';
const DEFAULT_PIECE_STYLE = 'cburnett';

const VALID_PIECE_IDS = new Set(AVAILABLE_PIECE_SETS.map((p) => p.id));

function normalizePieceId(value: unknown): string {
  return typeof value === 'string' && VALID_PIECE_IDS.has(value)
    ? value
    : DEFAULT_PIECE_STYLE;
}

export function useBoardPieceSet(): [string, (id: string) => void] {
  const [pieceStyle, setPieceStyle] = useLocalStorage<string>(
    PIECE_STYLE_KEY,
    DEFAULT_PIECE_STYLE
  );

  const didHydrate = useRef(false);
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    let cancelled = false;
    void hydrateFromSync(
      PIECE_STYLE_KEY,
      (decoded) => {
        const id = normalizePieceId(decoded);
        if (id !== pieceStyle) setPieceStyle(id);
      },
      () => cancelled,
      'piece set'
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = useCallback(
    (id: string) => {
      const valid = normalizePieceId(id);
      setPieceStyle(valid);
      try {
        if (syncStorage)
          void syncStorage.set(PIECE_STYLE_KEY, JSON.stringify(valid));
      } catch (err: unknown) {
        logger.error('Failed to sync piece set:', err);
      }
    },
    [setPieceStyle]
  );

  return [pieceStyle, select];
}
