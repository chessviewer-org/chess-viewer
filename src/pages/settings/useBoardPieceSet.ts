import { useCallback, useEffect, useRef } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';
import { useLocalStorage } from '@hooks';
import { PIECE_SETS } from '@constants';

import { logger, safeJSONParse } from '@utils';

/**
 * Board piece-set preference, wired to the SAME source the board already reads.
 *
 * HomePage's board state (`useHomeBoardState`) persists the active piece set to
 * the `chess-piece-style` localStorage key via `useLocalStorage` (JSON-encoded,
 * default `cburnett`). To make the Board settings page actually drive the board
 * everywhere, this hook writes to that exact key/format — it is NOT a separate
 * `cv_board_piece_set` store, which would silently diverge from the board.
 *
 * On top of that local source of truth it layers best-effort E2EE cloud sync
 * (mirroring `useThemePersistence`): on mount it hydrates the choice from
 * `syncStorage` for a freshly signed-in device, and on change it pushes the new
 * value up. Local storage stays authoritative; cloud is convenience only.
 */

const PIECE_STYLE_KEY = 'chess-piece-style';
const DEFAULT_PIECE_STYLE = 'cburnett';

const VALID_PIECE_IDS = new Set(PIECE_SETS.map((p) => p.id));

function normalizePieceId(value: unknown): string {
  return typeof value === 'string' && VALID_PIECE_IDS.has(value)
    ? value
    : DEFAULT_PIECE_STYLE;
}

/** Returns the current piece-set id and a setter that persists locally + E2EE. */
export function useBoardPieceSet(): [string, (id: string) => void] {
  const [pieceStyle, setPieceStyle] = useLocalStorage<string>(
    PIECE_STYLE_KEY,
    DEFAULT_PIECE_STYLE
  );

  // Hydrate from cloud once (best-effort). Local stays the synchronous truth.
  const didHydrate = useRef(false);
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    let cancelled = false;
    const hydrate = async () => {
      try {
        if (!syncStorage) return;
        const result = await syncStorage.get(PIECE_STYLE_KEY);
        if (cancelled || !result || typeof result.value !== 'string') return;
        const id = normalizePieceId(
          safeJSONParse<string>(result.value, result.value)
        );
        if (id !== pieceStyle) setPieceStyle(id);
      } catch (err) {
        logger.error('Failed to hydrate piece set from sync:', err);
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
    // Intentionally mount-only: `pieceStyle`/`setPieceStyle` are read once to
    // seed the cloud comparison; re-running on every change would fight the
    // local source of truth. The ref guard makes this idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = useCallback(
    (id: string) => {
      const valid = normalizePieceId(id);
      setPieceStyle(valid);
      try {
        if (syncStorage)
          void syncStorage.set(PIECE_STYLE_KEY, JSON.stringify(valid));
      } catch (err) {
        logger.error('Failed to sync piece set:', err);
      }
    },
    [setPieceStyle]
  );

  return [pieceStyle, select];
}
