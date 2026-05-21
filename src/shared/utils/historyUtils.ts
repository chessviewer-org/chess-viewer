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
export function matchesFilters(entry: ActiveHistoryEntry | ArchivedHistoryEntry, filters: HistoryFilters): boolean {
  if (filters.fenSearch) {
    if (!entry.fen.toLowerCase().includes(filters.fenSearch.toLowerCase())) {
      return false;
    }
  }
  if (filters.dateFrom && entry.createdAt < filters.dateFrom) return false;
  if (filters.dateTo && entry.createdAt > filters.dateTo) return false;
  if (filters.status && calculateStatus(entry.lastActiveAt) !== filters.status) {
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
export function applyFilters<T extends ActiveHistoryEntry | ArchivedHistoryEntry>(
  entries: T[], 
  filters: HistoryFilters
): T[] {
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
export function partitionByArchiveStatus(entries: ActiveHistoryEntry[]): PartitionResult {
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
    isFavorite: entry.isFavorite,
  };
}

/** 
 * Converts an archived entry back to an active history entry shape. 
 * 
 * @param archived - Archived entry
 * @returns Active entry object
 */
export function convertFromArchivedEntry(archived: ArchivedHistoryEntry): ActiveHistoryEntry {
  return {
    id: archived.id,
    fen: archived.fen,
    createdAt: archived.createdAt,
    lastActiveAt: Date.now(),
    source: archived.source,
    isFavorite: archived.isFavorite,
  };
}

/** 
 * Returns a copy of the entry with `lastActiveAt` updated to now. 
 * 
 * @param entry - The entry to update
 * @returns New entry object with updated timestamp
 */
export function touchEntry<T extends ActiveHistoryEntry | ArchivedHistoryEntry>(entry: T): T {
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
    ...(dragSessionId ? { dragSessionId } : {}),
  };
}

/** 
 * Sorts entries by `lastActiveAt` descending. 
 * 
 * @param entries - List of entries
 * @returns Sorted copy of the list
 */
export function sortByMostRecent<T extends { lastActiveAt: number }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
}

/** 
 * Sorts entries by `archivedAt` descending. 
 * 
 * @param entries - List of archived entries
 * @returns Sorted copy of the list
 */
export function sortArchivedByArchiveDate(entries: ArchivedHistoryEntry[]): ArchivedHistoryEntry[] {
  return [...entries].sort((a, b) => b.archivedAt - a.archivedAt);
}
