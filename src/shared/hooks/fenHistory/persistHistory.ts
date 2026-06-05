import { syncStorage } from '@/features/auth/services/syncStorage';
import type { ActiveHistoryEntry } from '@app-types/history';

import {
  emitSyncTruncation,
  sortByMostRecent,
  trimToSyncBudget
} from '@utils/historyUtils';
import { logger } from '@utils/logger';

/**
 * Writes the active FEN history to `localStorage` and asynchronously syncs it
 * to Supabase via `syncStorage` (fire-and-forget). localStorage keeps the full
 * list; the cloud copy is trimmed to the newest entries that fit the per-value
 * server cap, so a growing history can't silently stop syncing.
 *
 * @param history - Current list of active history entries
 */
export const persistHistory = (history: ActiveHistoryEntry[]): void => {
  try {
    window.localStorage.setItem('fen-history', JSON.stringify(history));
    if (syncStorage) {
      const { kept, dropped } = trimToSyncBudget(sortByMostRecent(history));
      syncStorage
        .set('fen-history', JSON.stringify(kept))
        .then(() => emitSyncTruncation('history', dropped))
        .catch((err: Error) => logger.error('Cloud save failed:', err));
    }
  } catch (err) {
    logger.error('Failed to save history:', err);
  }
};
