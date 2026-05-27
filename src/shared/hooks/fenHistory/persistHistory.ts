import { syncStorage } from '@/features/auth/services/syncStorage';
import { logger } from '@utils/logger';
import type { ActiveHistoryEntry } from '@app-types/history';

/**
 * Writes the active FEN history to `localStorage` and asynchronously syncs it
 * to Supabase via `syncStorage` (fire-and-forget).
 *
 * @param history - Current list of active history entries
 */
export const persistHistory = (history: ActiveHistoryEntry[]): void => {
  try {
    const jsonData = JSON.stringify(history);
    window.localStorage.setItem('fen-history', jsonData);
    if (syncStorage) {
      syncStorage
        .set('fen-history', jsonData)
        .catch((err: Error) => logger.error('Cloud save failed:', err));
    }
  } catch (err) {
    logger.error('Failed to save history:', err);
  }
};
