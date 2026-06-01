import {
  convertFromArchivedEntry,
  convertToArchivedEntry,
  partitionByArchiveStatus,
  sortArchivedByArchiveDate
} from './historyUtils';
import { logger } from './logger';
import { getStoredValue, safeJSONParse } from './validation';

const ARCHIVE_STORAGE_KEY = 'fen-history-archive';
const MAX_ARCHIVE_SIZE = 10000;

/**
 * Loads the archive from cloud storage (if available) or localStorage.
 *
 * @returns {Promise<Object[]>} Archived entries
 */
export async function loadArchive() {
  try {
    if (window.storage && typeof window.storage.get === 'function') {
      const result = await window.storage.get(ARCHIVE_STORAGE_KEY);
      if (result && typeof result.value === 'string') {
        const parsed = safeJSONParse(result.value, null);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    logger.log('Cloud storage not available for archive');
  }
  try {
    const parsed = getStoredValue(ARCHIVE_STORAGE_KEY, null);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    logger.error('Failed to load archive:', err);
  }
  return [];
}

/**
 * Persists the archive to localStorage and cloud storage (if available).
 * Trims the archive to at most MAX_ARCHIVE_SIZE entries before saving.
 *
 * @param {Object[]} archive - Archive entries to save
 * @returns {Promise<void>}
 */
async function saveArchive(archive) {
  const trimmedArchive = archive.slice(0, MAX_ARCHIVE_SIZE);
  const jsonData = JSON.stringify(trimmedArchive);
  try {
    window.localStorage.setItem(ARCHIVE_STORAGE_KEY, jsonData);
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(ARCHIVE_STORAGE_KEY, jsonData);
    }
  } catch (err) {
    logger.error('Failed to save archive:', err);
    throw err;
  }
}

/**
 * Moves the given active entries into the existing archive.
 *
 * @param {Object[]} entries - Active entries to archive
 * @param {Object[]} existingArchive - Current archive contents
 * @param {string} [source='auto'] - Archiving source label
 * @returns {Promise<{ archive: Object[], archived: number }>}
 */
export async function archiveEntries(
  entries,
  existingArchive,
  source = 'auto'
) {
  const archivedEntries = entries.map((entry) =>
    convertToArchivedEntry(entry, source)
  );
  const newArchive = sortArchivedByArchiveDate([
    ...archivedEntries,
    ...existingArchive
  ]);
  await saveArchive(newArchive);
  return { archive: newArchive, archived: archivedEntries.length };
}

/**
 * Partitions active entries into those still active and those ready to archive.
 *
 * @param {Object[]} activeEntries - Current active history entries
 * @returns {Promise<{ toArchive: Object[], remaining: Object[] }>}
 */
async function findEntriesForAutoArchive(activeEntries) {
  const { active, toArchive } = partitionByArchiveStatus(activeEntries);
  return { toArchive, remaining: active };
}

/**
 * Moves an archived entry back to the active history.
 *
 * @param {number} id - Entry ID to reactivate
 * @param {Object[]} archive - Current archive
 * @returns {Promise<{ entry: Object, archive: Object[] }>}
 * @throws {Error} If the entry is not found in the archive
 */
export async function reactivateEntry(id, archive) {
  const archivedEntry = archive.find((entry) => entry.id === id);
  if (!archivedEntry) throw new Error('Archived entry not found');
  const reactivated = convertFromArchivedEntry(archivedEntry);
  const updatedArchive = archive.filter((entry) => entry.id !== id);
  await saveArchive(updatedArchive);
  return { entry: reactivated, archive: updatedArchive };
}

/**
 * Permanently removes an entry from the archive.
 *
 * @param {number} id - Entry ID to delete
 * @param {Object[]} archive - Current archive
 * @returns {Promise<Object[]>} Updated archive without the deleted entry
 */
export async function deleteArchivedEntry(id, archive) {
  const updatedArchive = archive.filter((entry) => entry.id !== id);
  await saveArchive(updatedArchive);
  return updatedArchive;
}

/**
 * Clears the entire archive from all storage backends.
 *
 * @returns {Promise<void>}
 */
export async function clearArchive() {
  try {
    window.localStorage.removeItem(ARCHIVE_STORAGE_KEY);
    if (window.storage && typeof window.storage.delete === 'function') {
      await window.storage.delete(ARCHIVE_STORAGE_KEY);
    }
  } catch (err) {
    logger.error('Failed to clear archive:', err);
    throw err;
  }
}

/**
 * Reads the active history from localStorage, archives eligible entries, and
 * persists both updated collections.
 *
 * @returns {Promise<{ entries: Object[], archive: Object[], archivedCount: number }>}
 */
export async function performAutoArchival() {
  try {
    const activeEntries = getStoredValue('fen-history', null);
    if (!Array.isArray(activeEntries)) {
      return { entries: [], archive: [], archivedCount: 0 };
    }
    const { toArchive, remaining } =
      await findEntriesForAutoArchive(activeEntries);

    if (toArchive.length === 0) {
      return {
        entries: activeEntries,
        archive: await loadArchive(),
        archivedCount: 0
      };
    }

    const existingArchive = await loadArchive();
    const { archive } = await archiveEntries(
      toArchive,
      existingArchive,
      'auto'
    );

    window.localStorage.setItem('fen-history', JSON.stringify(remaining));
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set('fen-history', JSON.stringify(remaining));
    }

    logger.log(`Auto-archived ${toArchive.length} entries`);
    return { entries: remaining, archive, archivedCount: toArchive.length };
  } catch (err) {
    logger.error('Auto-archival failed:', err);
    throw err;
  }
}
