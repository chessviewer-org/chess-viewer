import { syncStorage } from '@/features/auth/services/syncStorage';
import { ActiveHistoryEntry, ArchivedHistoryEntry } from '@app-types/history';

import {
  convertToArchivedEntry,
  emitSyncTruncation,
  mergeById,
  partitionByArchiveStatus,
  sortArchivedByArchiveDate,
  sortByMostRecent,
  trimToSyncBudget
} from './historyUtils';
import { logger } from './logger';
import { safeJSONParse } from './validation';

const ARCHIVE_STORAGE_KEY = 'fen-archive';

/**
 * Loads archived history from cloud or local storage.
 *
 * @returns Promise resolving to list of archived entries
 */
export async function loadArchive(): Promise<ArchivedHistoryEntry[]> {
  try {
    const localRaw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    const localData = safeJSONParse<ArchivedHistoryEntry[]>(localRaw, []);

    let cloudData: ArchivedHistoryEntry[] = [];
    if (syncStorage) {
      const result = await syncStorage.get(ARCHIVE_STORAGE_KEY);
      if (result)
        cloudData = safeJSONParse<ArchivedHistoryEntry[]>(result.value, []);
    }

    // The cloud copy is trimmed to the server cap while localStorage holds the
    // full archive, so union both rather than letting the trimmed cloud copy
    // shadow device-local older entries. Cloud wins id collisions.
    return sortArchivedByArchiveDate(mergeById(cloudData, localData));
  } catch (error) {
    logger.error('Failed to load archive:', error);
    return [];
  }
}

/**
 * Persists archived entries to cloud and local storage.
 *
 * @param archive - List of archived entries
 */
export async function saveArchive(
  archive: ArchivedHistoryEntry[]
): Promise<void> {
  try {
    // localStorage holds the complete archive; the cloud copy is trimmed to the
    // newest entries that fit the per-value cap so sync never silently stalls.
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
    if (syncStorage) {
      const { kept, dropped } = trimToSyncBudget(
        sortArchivedByArchiveDate(archive)
      );
      const result = await syncStorage.set(
        ARCHIVE_STORAGE_KEY,
        JSON.stringify(kept)
      );
      if (result === 'too-large') emitSyncTruncation('archive', kept.length);
      else emitSyncTruncation('archive', dropped);
    }
  } catch (error) {
    logger.error('Failed to save archive:', error);
  }
}

/**
 * Moves active history entries into the archive.
 *
 * @param archivedEntries - Entries to add to archive
 * @returns Promise resolving when complete
 */
export async function archiveEntries(
  archivedEntries: ArchivedHistoryEntry[]
): Promise<void> {
  if (archivedEntries.length === 0) return;
  const existingArchive = await loadArchive();
  const newArchive = sortArchivedByArchiveDate([
    ...archivedEntries,
    ...existingArchive
  ]);
  await saveArchive(newArchive);
}

/**
 * Permanently removes an entry from the archive.
 *
 * @param entryId - ID of the entry to delete
 * @returns Promise resolving to the updated archive list
 */
export async function deleteArchivedEntry(
  entryId: number
): Promise<ArchivedHistoryEntry[]> {
  const archive = await loadArchive();
  const updated = archive.filter((e) => e.id !== entryId);
  await saveArchive(updated);
  return updated;
}

/**
 * Clears all archived entries.
 */
export async function clearArchive(): Promise<void> {
  if (syncStorage) {
    await syncStorage.delete(ARCHIVE_STORAGE_KEY);
  }
  localStorage.removeItem(ARCHIVE_STORAGE_KEY);
}

/**
 * Automatically archives old history entries.
 *
 * @param currentHistory - List of active history entries
 * @returns Promise resolving to object with updated active history and newly archived count
 */
export async function performAutoArchival(
  currentHistory: ActiveHistoryEntry[]
): Promise<{ updatedHistory: ActiveHistoryEntry[]; archivedCount: number }> {
  const { active, toArchive } = partitionByArchiveStatus(currentHistory);
  if (toArchive.length === 0) {
    return { updatedHistory: currentHistory, archivedCount: 0 };
  }

  const archivedEntries = toArchive.map((e) =>
    convertToArchivedEntry(e, 'auto')
  );
  await archiveEntries(archivedEntries);

  // localStorage keeps every active entry; cloud gets the newest that fit.
  localStorage.setItem('fen-history', JSON.stringify(active));
  if (syncStorage) {
    const { kept, dropped } = trimToSyncBudget(sortByMostRecent(active));
    const result = await syncStorage.set('fen-history', JSON.stringify(kept));
    if (result === 'too-large') emitSyncTruncation('history', kept.length);
    else emitSyncTruncation('history', dropped);
  }

  return { updatedHistory: active, archivedCount: toArchive.length };
}

/**
 * Restores an archived entry back to active history.
 *
 * @param entryId - ID of the entry to reactivate
 * @returns Promise resolving to the updated archive list
 */
export async function reactivateEntry(
  entryId: number
): Promise<ArchivedHistoryEntry[]> {
  const archive = await loadArchive();
  const updated = archive.filter((e) => e.id !== entryId);
  await saveArchive(updated);
  return updated;
}
