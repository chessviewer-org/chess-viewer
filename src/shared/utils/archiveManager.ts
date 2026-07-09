import { syncStorage } from '@/auth';
import { ActiveHistoryEntry, ArchivedHistoryEntry } from '@app-types';

import {
  convertToArchivedEntry,
  mergeById,
  partitionByArchiveStatus,
  safeJSONParse,
  sortArchivedByArchiveDate,
  sortByMostRecent
} from '@chessviewer-org/chess-viewer';

import { emitSyncTruncation, trimToSyncBudget } from './historyUtils';
import { logger } from './logger';

// Constants
const ARCHIVE_STORAGE_KEY = 'fen-archive';

// Service
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

    return sortArchivedByArchiveDate(mergeById(cloudData, localData));
  } catch (error: unknown) {
    logger.error('Failed to load archive:', error);
    return [];
  }
}

async function saveArchive(archive: ArchivedHistoryEntry[]): Promise<void> {
  try {
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
  } catch (error: unknown) {
    logger.error('Failed to save archive:', error);
  }
}

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

export async function deleteArchivedEntry(
  entryId: number
): Promise<ArchivedHistoryEntry[]> {
  const archive = await loadArchive();
  const updated = archive.filter((e) => e.id !== entryId);
  await saveArchive(updated);
  return updated;
}

export async function clearArchive(): Promise<void> {
  if (syncStorage) {
    await syncStorage.delete(ARCHIVE_STORAGE_KEY);
  }
  localStorage.removeItem(ARCHIVE_STORAGE_KEY);
}

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

  localStorage.setItem('fen-history', JSON.stringify(active));
  if (syncStorage) {
    const { kept, dropped } = trimToSyncBudget(sortByMostRecent(active));
    const result = await syncStorage.set('fen-history', JSON.stringify(kept));
    if (result === 'too-large') emitSyncTruncation('history', kept.length);
    else emitSyncTruncation('history', dropped);
  }

  return { updatedHistory: active, archivedCount: toArchive.length };
}

export async function reactivateEntry(
  entryId: number
): Promise<ArchivedHistoryEntry[]> {
  const archive = await loadArchive();
  const updated = archive.filter((e) => e.id !== entryId);
  await saveArchive(updated);
  return updated;
}
