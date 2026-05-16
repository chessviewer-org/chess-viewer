import { 
  ActiveHistoryEntry, 
  ArchivedHistoryEntry, 
  ArchiveSource, 
  ArchiveStatistics, 
  HistorySource 
} from '@/types/history';

import {
  convertFromArchivedEntry,
  convertToArchivedEntry,
  partitionByArchiveStatus,
  sortArchivedByArchiveDate,
} from './historyUtils';
import { logger } from './logger';
import { safeJSONParse } from './validation';

const ARCHIVE_STORAGE_KEY = 'fen-history-archive';
const MAX_ARCHIVE_SIZE = 10000;

declare global {
  interface Window {
    storage?: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<void>;
      delete: (key: string) => Promise<void>;
    };
  }
}

/** Loads the archive from cloud storage (if available) or localStorage. */
export async function loadArchive(): Promise<ArchivedHistoryEntry[]> {
  try {
    if (window.storage && typeof window.storage.get === 'function') {
      const result = await window.storage.get(ARCHIVE_STORAGE_KEY);
      if (result && typeof result.value === 'string') {
        const parsed = safeJSONParse<ArchivedHistoryEntry[] | null>(result.value, null);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    logger.log('Cloud storage not available for archive');
  }
  
  try {
    const localData = window.localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (localData) {
      const parsed = safeJSONParse<ArchivedHistoryEntry[] | null>(localData, null);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err: unknown) {
    logger.error('Failed to load archive:', err);
  }
  return [];
}

/** Persists the archive to localStorage and cloud storage (if available). */
export async function saveArchive(archive: ArchivedHistoryEntry[]): Promise<void> {
  const trimmedArchive = archive.slice(0, MAX_ARCHIVE_SIZE);
  const jsonData = JSON.stringify(trimmedArchive);
  try {
    window.localStorage.setItem(ARCHIVE_STORAGE_KEY, jsonData);
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(ARCHIVE_STORAGE_KEY, jsonData);
    }
  } catch (err: unknown) {
    logger.error('Failed to save archive:', err);
    throw err;
  }
}

export interface ArchiveEntriesResult {
  archive: ArchivedHistoryEntry[];
  archived: number;
}

/** Moves the given active entries into the existing archive. */
export async function archiveEntries(
  entries: ActiveHistoryEntry[],
  existingArchive: ArchivedHistoryEntry[],
  source: ArchiveSource = 'auto'
): Promise<ArchiveEntriesResult> {
  const archivedEntries = entries.map((entry) => convertToArchivedEntry(entry, source));
  const newArchive = sortArchivedByArchiveDate([...archivedEntries, ...existingArchive]);
  await saveArchive(newArchive);
  return { archive: newArchive, archived: archivedEntries.length };
}

export interface FindArchiveResult {
  toArchive: ActiveHistoryEntry[];
  remaining: ActiveHistoryEntry[];
}

/** Partitions active entries into those still active and those ready to archive. */
export async function findEntriesForAutoArchive(activeEntries: ActiveHistoryEntry[]): Promise<FindArchiveResult> {
  const { active, toArchive } = partitionByArchiveStatus(activeEntries);
  return { toArchive, remaining: active };
}

export interface ReactivateResult {
  entry: ActiveHistoryEntry;
  archive: ArchivedHistoryEntry[];
}

/** Moves an archived entry back to the active history. */
export async function reactivateEntry(id: number, archive: ArchivedHistoryEntry[]): Promise<ReactivateResult> {
  const archivedEntry = archive.find((entry) => entry.id === id);
  if (!archivedEntry) throw new Error('Archived entry not found');
  
  const reactivated = convertFromArchivedEntry(archivedEntry);
  const updatedArchive = archive.filter((entry) => entry.id !== id);
  await saveArchive(updatedArchive);
  
  return { entry: reactivated, archive: updatedArchive };
}

/** Permanently removes an entry from the archive. */
export async function deleteArchivedEntry(id: number, archive: ArchivedHistoryEntry[]): Promise<ArchivedHistoryEntry[]> {
  const updatedArchive = archive.filter((entry) => entry.id !== id);
  await saveArchive(updatedArchive);
  return updatedArchive;
}

/** Clears the entire archive from all storage backends. */
export async function clearArchive(): Promise<void> {
  try {
    window.localStorage.removeItem(ARCHIVE_STORAGE_KEY);
    if (window.storage && typeof window.storage.delete === 'function') {
      await window.storage.delete(ARCHIVE_STORAGE_KEY);
    }
  } catch (err: unknown) {
    logger.error('Failed to clear archive:', err);
    throw err;
  }
}

/** Computes summary statistics for the archive. */
export function getArchiveStatistics(archive: ArchivedHistoryEntry[]): ArchiveStatistics {
  const stats: ArchiveStatistics = {
    total: archive.length,
    bySource: { manual: 0, export: 0, drag: 0 },
    favorites: 0,
  };
  
  for (const entry of archive) {
    if (entry.source in stats.bySource) stats.bySource[entry.source]++;
    if (entry.isFavorite) stats.favorites++;
  }
  return stats;
}

export interface AutoArchivalResult {
  entries: ActiveHistoryEntry[];
  archive: ArchivedHistoryEntry[];
  archivedCount: number;
}

/** Reads active history from localStorage, archives eligible entries, and persists both. */
export async function performAutoArchival(): Promise<AutoArchivalResult> {
  try {
    const historyData = window.localStorage.getItem('fen-history');
    if (!historyData) return { entries: [], archive: [], archivedCount: 0 };

    const activeEntries = safeJSONParse<ActiveHistoryEntry[] | null>(historyData, null);
    if (!Array.isArray(activeEntries)) {
      return { entries: [], archive: [], archivedCount: 0 };
    }
    
    const { toArchive, remaining } = await findEntriesForAutoArchive(activeEntries);

    if (toArchive.length === 0) {
      return {
        entries: activeEntries,
        archive: await loadArchive(),
        archivedCount: 0,
      };
    }

    const existingArchive = await loadArchive();
    const { archive } = await archiveEntries(toArchive, existingArchive, 'auto');

    window.localStorage.setItem('fen-history', JSON.stringify(remaining));
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set('fen-history', JSON.stringify(remaining));
    }

    logger.log(`Auto-archived ${toArchive.length} entries`);
    return { entries: remaining, archive, archivedCount: toArchive.length };
  } catch (err: unknown) {
    logger.error('Auto-archival failed:', err);
    throw err;
  }
}
