import { SAFE_SYNC_PLAINTEXT_BUDGET } from '@/auth';
import { SYNC_TRUNCATED_EVENT, type SyncTruncatedDetail } from '@constants';

export function trimToSyncBudget<T>(entries: T[]): {
  kept: T[];
  dropped: number;
} {
  if (JSON.stringify(entries).length <= SAFE_SYNC_PLAINTEXT_BUDGET) {
    return { kept: entries, dropped: 0 };
  }
  let kept = entries;
  while (
    kept.length > 0 &&
    JSON.stringify(kept).length > SAFE_SYNC_PLAINTEXT_BUDGET
  ) {
    kept = kept.slice(0, -1);
  }
  return { kept, dropped: entries.length - kept.length };
}

export function emitSyncTruncation(
  dataset: SyncTruncatedDetail['dataset'],
  dropped: number
): void {
  if (dropped <= 0) return;
  window.dispatchEvent(
    new CustomEvent<SyncTruncatedDetail>(SYNC_TRUNCATED_EVENT, {
      detail: { dataset, dropped }
    })
  );
}
