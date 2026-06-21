import { useCallback, useEffect, useRef } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';
import { PIECE_SETS } from '@constants';

import { hydrateFromSync, logger } from '@utils';
import { useLocalStorage } from './useLocalStorage';

const PIECE_STYLE_KEY = 'chess-piece-style';
const DEFAULT_PIECE_STYLE = 'cburnett';

const VALID_PIECE_IDS = new Set(PIECE_SETS.map((p) => p.id));

function normalizePieceId(value: unknown): string {
  return typeof value === 'string' && VALID_PIECE_IDS.has(value)
    ? value
    : DEFAULT_PIECE_STYLE;
}

/**
 * Board piece-set preference wired to the same localStorage key the board reads.
 * Layers best-effort cloud sync on top; local storage stays authoritative.
 */
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
