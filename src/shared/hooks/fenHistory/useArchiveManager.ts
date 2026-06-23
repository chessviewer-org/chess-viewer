import { useCallback, useState } from 'react';

import type { ActiveHistoryEntry, ArchivedHistoryEntry } from '@app-types';

import {
  clearArchive as clearArchiveUtil,
  deleteArchivedEntry as deleteArchivedEntryUtil,
  loadArchive,
  logger,
  reactivateEntry as reactivateEntryUtil,
  sortByMostRecent
} from '@utils';

/** Arguments for `useArchiveManager`. */
interface UseArchiveManagerArgs {
  setFenHistory: React.Dispatch<React.SetStateAction<ActiveHistoryEntry[]>>;
}

/**
 * Manages the FEN archive — loading, reactivating, deleting, and clearing archived entries.
 *
 * @param args - Requires `setFenHistory` to restore entries to the active list on reactivation
 */
export function useArchiveManager({ setFenHistory }: UseArchiveManagerArgs) {
  const [archive, setArchive] = useState<ArchivedHistoryEntry[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);

  const loadArchiveData = useCallback(async () => {
    setIsLoadingArchive(true);
    try {
      setArchive(await loadArchive());
    } finally {
      setIsLoadingArchive(false);
    }
  }, []);

  const reactivateArchivedEntry = useCallback(
    async (id: number) => {
      try {
        const entry = archive.find((e) => e.id === id);
        if (!entry) throw new Error('Entry not found in archive');
        const updatedArchive = await reactivateEntryUtil(id);
        setArchive(updatedArchive);
        setFenHistory((prev) =>
          sortByMostRecent([
            {
              id: entry.id,
              fen: entry.fen,
              createdAt: entry.createdAt,
              lastActiveAt: Date.now(),
              source: entry.source,
              isFavorite: entry.isFavorite
            },
            ...prev
          ])
        );
      } catch (err: unknown) {
        logger.error('Failed to reactivate entry:', err);
        throw err;
      }
    },
    [archive, setFenHistory]
  );

  const deleteFromArchive = useCallback(async (id: number) => {
    try {
      const updatedArchive = await deleteArchivedEntryUtil(id);
      setArchive(updatedArchive);
    } catch (err: unknown) {
      logger.error('Failed to delete from archive:', err);
      throw err;
    }
  }, []);

  const clearArchiveData = useCallback(async () => {
    try {
      await clearArchiveUtil();
      setArchive([]);
    } catch (err: unknown) {
      logger.error('Failed to clear archive:', err);
      throw err;
    }
  }, []);

  return {
    archive,
    isLoadingArchive,
    loadArchiveData,
    reactivateArchivedEntry,
    deleteFromArchive,
    clearArchiveData
  };
}
