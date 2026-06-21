import { syncStorage } from '@/features/auth/services/syncStorage';
import type { ActiveHistoryEntry } from '@app-types';

import { emitSyncTruncation, sortByMostRecent, trimToSyncBudget } from '@utils';
import { logger } from '@utils';

/**
 * Writes the active FEN history to `localStorage` and asynchronously syncs it
 * to Supabase via `syncStorage` (fire-and-forget). localStorage keeps the full
 * list; the cloud copy is trimmed to the newest entries that fit the per-value
 * server cap, so a growing history can't silently stop syncing.
 *
 * @param history - Current list of active history entries
 * @param notifyTruncation - When `false`, suppresses the "Cloud full" toast.
 *   The first persist after hydration is a round-trip echo of what we just
 *   loaded (not a user edit), so a truncation there must not surface a toast on
 *   page load. Genuine user-triggered writes pass `true`.
 */
export const persistHistory = (
  history: ActiveHistoryEntry[],
  notifyTruncation = true
): void => {
  try {
    window.localStorage.setItem('fen-history', JSON.stringify(history));
    if (syncStorage) {
      const { kept, dropped } = trimToSyncBudget(sortByMostRecent(history));
      syncStorage
        .set('fen-history', JSON.stringify(kept))
        .then((result) => {
          if (!notifyTruncation) return;
          // 'too-large' means even the trimmed prefix exceeded the server cap,
          // so nothing reached the cloud — that's `kept.length` entries dropped.
          if (result === 'too-large')
            emitSyncTruncation('history', kept.length);
          else emitSyncTruncation('history', dropped);
        })
        .catch((err: Error) => logger.error('Cloud save failed:', err));
    }
  } catch (err: unknown) {
    logger.error('Failed to save history:', err);
  }
};
