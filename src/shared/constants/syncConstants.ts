export const SYNC_TRUNCATED_EVENT = 'cv:sync-truncated';

export interface SyncTruncatedDetail {
  dataset: 'history' | 'archive';
  dropped: number;
}
