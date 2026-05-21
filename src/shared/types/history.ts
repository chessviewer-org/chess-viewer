export type HistorySource = 'manual' | 'export' | 'drag';
export type ArchiveSource = 'auto' | 'manual';
export type FreshnessStatus = 'green' | 'yellow' | 'red';

export interface BaseHistoryEntry {
  id: number;
  fen: string;
  createdAt: number;
  lastActiveAt: number;
  source: HistorySource;
  isFavorite: boolean;
}

export interface ActiveHistoryEntry extends BaseHistoryEntry {
  dragSessionId?: string;
}

export interface ArchivedHistoryEntry extends BaseHistoryEntry {
  archivedAt: number;
  archiveSource: ArchiveSource;
}

export interface HistoryFilters {
  fenSearch?: string;
  dateFrom?: number;
  dateTo?: number;
  status?: FreshnessStatus;
  source?: HistorySource;
  favoritesOnly?: boolean;
}

export interface ArchiveStatistics {
  total: number;
  bySource: Record<HistorySource, number>;
  favorites: number;
}
