import { SAFE_SYNC_PLAINTEXT_BUDGET } from '@/features/auth/services/syncStorage';
import { SYNC_TRUNCATED_EVENT, type SyncTruncatedDetail } from '@constants';
import {
  ActiveHistoryEntry,
  ArchivedHistoryEntry,
  ArchiveSource,
  FreshnessStatus,
  HistoryFilters,
  HistorySource
} from '@app-types/history';

const DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * DAY_MS;
const THIRTY_DAYS_MS = 30 * DAY_MS;
const NINETY_DAYS_MS = 90 * DAY_MS;

/**
 * Returns the longest newest-first prefix of `entries` whose JSON serialization
 * fits the cloud per-value budget. localStorage always keeps the full list; this
 * only bounds what reaches the cloud so a growing history can't silently stop
 * syncing once it crosses the `user_data` server cap. `entries` is assumed
 * already ordered newest-first by the caller.
 *
 * @returns The kept prefix and how many trailing (oldest) entries were dropped.
 */
export function trimToSyncBudget<T>(entries: T[]): {
  kept: T[];
  dropped: number;
} {
  if (JSON.stringify(entries).length <= SAFE_SYNC_PLAINTEXT_BUDGET) {
    return { kept: entries, dropped: 0 };
  }
  // History writes are infrequent and lists are capped well under the size where
  // a linear shrink would matter, so a plain pop loop beats a binary search here.
  let kept = entries;
  while (
    kept.length > 0 &&
    JSON.stringify(kept).length > SAFE_SYNC_PLAINTEXT_BUDGET
  ) {
    kept = kept.slice(0, -1);
  }
  return { kept, dropped: entries.length - kept.length };
}

/** Notifies the app that a cloud sync dropped older entries (see SYNC_TRUNCATED_EVENT). */
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

/**
 * Returns a color-coded freshness status for a history entry.
 *
 * @param lastActiveAt - Timestamp of last activity
 * @returns Status string ('green', 'yellow', or 'red')
 */
export function calculateStatus(lastActiveAt: number): FreshnessStatus {
  const age = Date.now() - lastActiveAt;
  if (age < SEVEN_DAYS_MS) return 'green';
  if (age < THIRTY_DAYS_MS) return 'yellow';
  return 'red';
}

/**
 * Checks if the entry is old enough to archive (90+ days).
 *
 * @param lastActiveAt - Timestamp of last activity
 * @returns True if old enough
 */
export function shouldArchive(lastActiveAt: number): boolean {
  return Date.now() - lastActiveAt >= NINETY_DAYS_MS;
}

/**
 * Checks whether a single history entry matches the given filter criteria.
 *
 * @param entry - The entry to check
 * @param filters - Filter criteria
 * @returns True if entry matches all filters
 */
export function matchesFilters(
  entry: ActiveHistoryEntry | ArchivedHistoryEntry,
  filters: HistoryFilters
): boolean {
  if (filters.fenSearch) {
    if (!entry.fen.toLowerCase().includes(filters.fenSearch.toLowerCase())) {
      return false;
    }
  }
  if (filters.dateFrom && entry.createdAt < filters.dateFrom) return false;
  if (filters.dateTo && entry.createdAt > filters.dateTo) return false;
  if (
    filters.status &&
    calculateStatus(entry.lastActiveAt) !== filters.status
  ) {
    return false;
  }
  if (filters.source && entry.source !== filters.source) return false;
  if (filters.favoritesOnly && !entry.isFavorite) return false;
  return true;
}

/**
 * Filters a list of history entries by the given criteria.
 *
 * @param entries - List of entries
 * @param filters - Filter criteria
 * @returns Filtered list
 */
export function applyFilters<
  T extends ActiveHistoryEntry | ArchivedHistoryEntry
>(entries: T[], filters: HistoryFilters): T[] {
  if (!filters || Object.keys(filters).length === 0) return entries;
  return entries.filter((entry) => matchesFilters(entry, filters));
}

export interface PartitionResult {
  active: ActiveHistoryEntry[];
  toArchive: ActiveHistoryEntry[];
}

/**
 * Splits entries into those that remain active and those ready to archive.
 *
 * @param entries - List of active entries
 * @returns Object containing active and toArchive arrays
 */
export function partitionByArchiveStatus(
  entries: ActiveHistoryEntry[]
): PartitionResult {
  const active: ActiveHistoryEntry[] = [];
  const toArchive: ActiveHistoryEntry[] = [];
  for (const entry of entries) {
    if (entry.isFavorite || !shouldArchive(entry.lastActiveAt)) {
      active.push(entry);
    } else {
      toArchive.push(entry);
    }
  }
  return { active, toArchive };
}

/**
 * Converts an active history entry into an archived entry shape.
 *
 * @param entry - Active entry
 * @param archiveSource - Source of archival ('auto' or 'manual')
 * @returns Archived entry object
 */
export function convertToArchivedEntry(
  entry: ActiveHistoryEntry,
  archiveSource: ArchiveSource = 'auto'
): ArchivedHistoryEntry {
  return {
    id: entry.id,
    fen: entry.fen,
    createdAt: entry.createdAt,
    lastActiveAt: entry.lastActiveAt,
    archivedAt: Date.now(),
    source: entry.source,
    archiveSource,
    isFavorite: entry.isFavorite
  };
}

/**
 * Returns a copy of the entry with `lastActiveAt` updated to now.
 *
 * @param entry - The entry to update
 * @returns New entry object with updated timestamp
 */
export function touchEntry<T extends ActiveHistoryEntry | ArchivedHistoryEntry>(
  entry: T
): T {
  return { ...entry, lastActiveAt: Date.now() };
}

/**
 * Creates a new history entry for the given FEN.
 *
 * @param fen - FEN string
 * @param source - Source of the entry
 * @param dragSessionId - Optional drag session ID
 * @returns New history entry object
 */
export function createHistoryEntry(
  fen: string,
  source: HistorySource,
  dragSessionId: string | null = null
): ActiveHistoryEntry {
  const now = Date.now();
  return {
    id: now,
    fen,
    createdAt: now,
    lastActiveAt: now,
    source,
    isFavorite: false,
    ...(dragSessionId ? { dragSessionId } : {})
  };
}

/**
 * Sorts entries by `lastActiveAt` descending.
 *
 * @param entries - List of entries
 * @returns Sorted copy of the list
 */
export function sortByMostRecent<T extends { lastActiveAt: number }>(
  entries: T[]
): T[] {
  return [...entries].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
}

/**
 * Sorts entries by `archivedAt` descending.
 *
 * @param entries - List of archived entries
 * @returns Sorted copy of the list
 */
export function sortArchivedByArchiveDate(
  entries: ArchivedHistoryEntry[]
): ArchivedHistoryEntry[] {
  return [...entries].sort((a, b) => b.archivedAt - a.archivedAt);
}

/**
 * Unions two history lists by `id`, keeping every distinct entry. Needed because
 * the cloud copy is trimmed to fit the server cap (see {@link trimToSyncBudget})
 * while localStorage retains the full list: hydrating from the cloud alone would
 * silently drop the device-local older entries. `primary` wins on id collisions
 * (it is the fresher source — e.g. cloud, which may carry entries from another
 * device). Order is not guaranteed; callers sort as needed.
 */
export function mergeById<T extends { id: number }>(
  primary: T[],
  secondary: T[]
): T[] {
  const byId = new Map<number, T>();
  for (const entry of secondary) byId.set(entry.id, entry);
  for (const entry of primary) byId.set(entry.id, entry);
  return [...byId.values()];
}
