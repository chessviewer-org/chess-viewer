import { syncStorage } from '@/features/auth/services/syncStorage';
import { ActiveHistoryEntry, ArchivedHistoryEntry } from '@app-types/history';

import {
  convertToArchivedEntry,
  partitionByArchiveStatus,
  sortArchivedByArchiveDate
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
    if (syncStorage) {
      const result = await syncStorage.get(ARCHIVE_STORAGE_KEY);
      if (result) return safeJSONParse(result.value, []);
    }
    const local = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    return safeJSONParse(local, []);
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
    const jsonData = JSON.stringify(archive);
    if (syncStorage) {
      await syncStorage.set(ARCHIVE_STORAGE_KEY, jsonData);
    }
    localStorage.setItem(ARCHIVE_STORAGE_KEY, jsonData);
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

  if (syncStorage) {
    await syncStorage.set('fen-history', JSON.stringify(active));
  }
  localStorage.setItem('fen-history', JSON.stringify(active));

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
