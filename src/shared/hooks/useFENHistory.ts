import { useEffect, useRef, useState } from 'react';
import type {
  ActiveHistoryEntry,
  ArchivedHistoryEntry,
  HistoryFilters,
  HistorySource
} from '@app-types';
import {
  applyFilters,
  archiveEntries as archiveEntriesUtil,
  clearArchive as clearArchiveUtil,
  createHistoryEntry,
  deleteArchivedEntry as deleteArchivedEntryUtil,
  emitSyncTruncation,
  loadArchive,
  logger,
  mergeById,
  performAutoArchival,
  reactivateEntry as reactivateEntryUtil,
  safeJSONParse,
  sortByMostRecent,
  touchEntry,
  trimToSyncBudget,
  validateFEN
} from '@/shared/utils';
import { syncStorage } from '@/auth';

export const persistHistory = (
  history: ActiveHistoryEntry[],
  notifyUser = true
) => {
  try {
    const stringified = JSON.stringify(history);
    window.localStorage.setItem('fen-history', stringified);

    if (!syncStorage) return;

    const { kept, dropped } = trimToSyncBudget(sortByMostRecent(history));
    syncStorage
      .set('fen-history', JSON.stringify(kept))
      .then((res) => {
        if (notifyUser) {
          emitSyncTruncation(
            'history',
            res === 'too-large' ? kept.length : dropped
          );
        }
      })
      .catch((e) => logger.error('Sync failed', e));
  } catch (e) {
    logger.error('Save failed', e);
  }
};

const MAX_HISTORY = 200;

const capHistory = (arr: ActiveHistoryEntry[]) => {
  if (arr.length <= MAX_HISTORY) return arr;

  const favorites = arr.filter((e) => e.isFavorite);
  if (favorites.length >= MAX_HISTORY) return favorites;

  let nonFavoriteSlotsLeft = MAX_HISTORY - favorites.length;
  return arr.filter((e) => {
    if (e.isFavorite) return true;
    if (nonFavoriteSlotsLeft > 0) {
      nonFavoriteSlotsLeft--;
      return true;
    }
    return false;
  });
};

export function useFENHistory(
  fen: string,
  onFavChange?: (isFav: boolean) => void
) {
  const [history, setHistory] = useState<ActiveHistoryEntry[]>([]);
  const [archive, setArchive] = useState<ArchivedHistoryEntry[]>([]);

  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>({});
  const [archiveFilters, setArchiveFilters] = useState<HistoryFilters>({});

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const cloud = await syncStorage.get('fen-history').catch(() => null);
        const cloudData = cloud?.value ? safeJSONParse(cloud.value, []) : [];
        const localData = safeJSONParse(
          window.localStorage.getItem('fen-history') || '[]',
          []
        );

        if (isMounted) {
          setHistory(sortByMostRecent(mergeById(cloudData, localData)));
        }
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const isFirstSave = useRef(true);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      persistHistory(history, !isFirstSave.current);
      isFirstSave.current = false;
    }, 500);

    return () => clearTimeout(timer);
  }, [history, isHydrated]);

  const historyRef = useRef(history);
  historyRef.current = history;

  useEffect(() => {
    if (!isHydrated) return;

    const runAutoArchive = async () => {
      try {
        const result = await performAutoArchival(historyRef.current);
        if (result.archivedCount > 0) {
          setHistory(result.updatedHistory);
        }
      } catch (err) {
        logger.error('Auto-archive failed:', err);
      }
    };

    runAutoArchive();

    const intervalId = setInterval(runAutoArchive, 3600000);
    return () => clearInterval(intervalId);
  }, [isHydrated]);

  const isFav = !!history.find((h) => h.fen === fen)?.isFavorite;
  const previousFavRef = useRef(false);

  useEffect(() => {
    if (isHydrated && previousFavRef.current !== isFav) {
      if (onFavChange) onFavChange(isFav);
      previousFavRef.current = isFav;
    }
  }, [isFav, isHydrated, onFavChange]);

  function commitNewFen(f: string, source: HistorySource, dragId?: string) {
    if (!validateFEN(f)) return;

    setHistory((prevHistory) => {
      if (prevHistory[0]?.fen === f) {
        return prevHistory.map((entry, index) =>
          index === 0 ? touchEntry(entry) : entry
        );
      }

      const newEntry = createHistoryEntry(f, source, dragId);
      return capHistory(sortByMostRecent([newEntry, ...prevHistory]));
    });
  }

  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragIdRef = useRef<string | null>(null);
  const currentFenRef = useRef(fen);
  currentFenRef.current = fen;

  const notifyDragAction = () => {
    if (!dragIdRef.current) dragIdRef.current = `drag-${Date.now()}`;
    if (dragTimerRef.current) clearTimeout(dragTimerRef.current);

    dragTimerRef.current = setTimeout(() => {
      commitNewFen(currentFenRef.current, 'drag', dragIdRef.current!);
      dragIdRef.current = null;
    }, 60000);
  };

  const saveManualFen = (f: string) => {
    if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    commitNewFen(f, 'manual');
  };

  const saveExportFen = (f: string) => commitNewFen(f, 'export');

  const toggleFavorite = (id: number) => {
    setHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isFavorite: !h.isFavorite } : h))
    );
  };

  const deleteHistory = (id: number) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const clearHistory = async () => {
    setHistory([]);
    window.localStorage.removeItem('fen-history');
    await syncStorage.delete('fen-history').catch(() => {});
  };

  const addCurrentToFavorites = async (
    f: string,
    callback?: (msg: string, type: 'success' | 'error') => void
  ) => {
    if (!validateFEN(f)) {
      if (callback) callback('Invalid FEN', 'error');
      return;
    }

    setHistory((prev) => {
      const existing = prev.find((h) => h.fen === f);

      if (existing) {
        if (callback) {
          callback(
            existing.isFavorite
              ? 'Removed from favorites'
              : 'Added to favorites',
            'success'
          );
        }
        return prev.map((h) =>
          h.fen === f
            ? { ...h, isFavorite: !h.isFavorite, lastActiveAt: Date.now() }
            : h
        );
      }

      if (callback) callback('Added to favorites ★', 'success');

      const newEntry = createHistoryEntry(f, 'manual');
      newEntry.isFavorite = true;
      return capHistory(sortByMostRecent([newEntry, ...prev]));
    });
  };

  const archiveHistoryEntries = async (ids: number[]) => {
    const toArchive = history
      .filter((e) => ids.includes(e.id))
      .map((e) => ({
        ...e,
        archivedAt: Date.now(),
        archiveSource: 'manual'
      })) as unknown as ArchivedHistoryEntry[];

    try {
      await archiveEntriesUtil(toArchive);
      setHistory(history.filter((e) => !ids.includes(e.id)));
    } catch (e) {
      logger.error('Manual archive failed:', e);
    }
  };

  const loadArchiveData = async () => {
    setIsLoadingArchive(true);
    try {
      const data = await loadArchive();
      setArchive(data);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const reactivateArchivedEntry = async (id: number) => {
    const entry = archive.find((e) => e.id === id);
    if (!entry) throw new Error('Not found');

    setArchive(await reactivateEntryUtil(id));
    setHistory((prev) =>
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
  };

  const deleteFromArchive = async (id: number) => {
    setArchive(await deleteArchivedEntryUtil(id));
  };

  const clearArchiveData = async () => {
    await clearArchiveUtil();
    setArchive([]);
  };

  return {
    fenHistory: applyFilters(history, historyFilters),
    rawHistory: history,

    archive: applyFilters(archive, archiveFilters),
    rawArchive: archive,

    isLoadingArchive,
    setHistoryFilters,
    setArchiveFilters,

    toggleFavorite,
    deleteHistory,
    clearHistory,
    saveManualFen,
    saveExportFen,
    notifyDragAction,
    addCurrentToFavorites,

    archiveHistoryEntries,
    reactivateArchivedEntry,
    deleteFromArchive,
    clearArchiveData,
    loadArchiveData
  };
}
