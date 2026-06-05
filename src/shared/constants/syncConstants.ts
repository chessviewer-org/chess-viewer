/** Constants for the cloud-sync truncation signal. Kept dependency-free so both
 *  the dispatcher (archiveManager, a util) and the listener (useNotifications, a
 *  hook) can import without a util↔hook cycle. */

/**
 * Window event dispatched when a history/archive cloud write was trimmed to fit
 * the `user_data` server cap. The newest entries are still synced and the full
 * list remains in localStorage; this only surfaces that older entries did not
 * reach the cloud. `useNotifications` listens (wherever the notification surface
 * is mounted) and shows one warning toast.
 */
export const SYNC_TRUNCATED_EVENT = 'cv:sync-truncated';

/** Detail payload carried by {@link SYNC_TRUNCATED_EVENT}. */
export interface SyncTruncatedDetail {
  /** Which dataset was trimmed, for a precise user-facing message. */
  dataset: 'history' | 'archive';
  /** How many entries were dropped from the cloud copy. */
  dropped: number;
}
