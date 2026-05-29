/** How a FEN entry was added to history. */
export type HistorySource = 'manual' | 'export' | 'drag';
/** How an entry was moved to the archive. */
export type ArchiveSource = 'auto' | 'manual';
/** Color-coded age indicator for a history entry. */
export type FreshnessStatus = 'green' | 'yellow' | 'red';

/** Shared fields between active and archived history entries. */
export interface BaseHistoryEntry {
  id: number;
  fen: string;
  createdAt: number;
  lastActiveAt: number;
  source: HistorySource;
  isFavorite: boolean;
}

/** A FEN entry in the active (non-archived) history list. */
export interface ActiveHistoryEntry extends BaseHistoryEntry {
  dragSessionId?: string;
}

/** A FEN entry that has been moved to the archive. */
export interface ArchivedHistoryEntry extends BaseHistoryEntry {
  archivedAt: number;
  archiveSource: ArchiveSource;
}

/** Filter criteria applied to the history and archive lists. */
export interface HistoryFilters {
  fenSearch?: string;
  dateFrom?: number;
  dateTo?: number;
  status?: FreshnessStatus;
  source?: HistorySource;
  favoritesOnly?: boolean;
}

