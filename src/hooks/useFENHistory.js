import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { validateFEN } from '@/utils';
import {
  archiveEntries as archiveEntriesUtil,
  clearArchive as clearArchiveUtil,
  deleteArchivedEntry as deleteArchivedEntryUtil,
  loadArchive,
  performAutoArchival,
  reactivateEntry as reactivateEntryUtil
} from '@/utils/archiveManager';
import {
  applyFilters,
  calculateStatus,
  createHistoryEntry,
  sortByMostRecent,
  touchEntry
} from '@/utils/historyUtils';
import { logger } from '@/utils/logger';
import { getStoredValue, safeJSONParse } from '@/utils/validation';

const DRAG_INACTIVITY_TIMEOUT = 60000;

/**
 * Persists history to local storage and cloud.
 *
 * @param {Array} history - The FEN history array
 */
const persistHistory = (history) => {
  try {
    const jsonData = JSON.stringify(history);
    window.localStorage.setItem('fen-history', jsonData);
    if (window.storage?.set) {
      window.storage
        .set('fen-history', jsonData)
        .catch((err) => logger.error('Cloud save failed:', err));
    }
  } catch (err) {
    logger.error('Failed to save history:', err);
  }
};

/**
 * Custom hook for managing FEN history and archiving.
 *
 * @param {string} fen - Current FEN string
 * @param {function(boolean): void} onFavoriteStatusChange - Callback when favorite status changes
 * @returns {Object} History state and actions
 */
export function useFENHistory(fen, onFavoriteStatusChange) {
  const [fenHistory, setFenHistory] = useState([]);
  const [archive, setArchive] = useState([]);
  const [filters, setFilters] = useState({});
  const [archiveFilters, setArchiveFilters] = useState({});
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const dragTimerRef = useRef(null);
  const dragSessionIdRef = useRef(null);
  const latestFenRef = useRef(fen);
  const fenHistoryRef = useRef(fenHistory);
  const isMountedRef = useRef(true);

  useEffect(() => {
    latestFenRef.current = fen;
  }, [fen]);
  useEffect(() => {
    fenHistoryRef.current = fenHistory;
  }, [fenHistory]);
  useEffect(() => {
    isMountedRef.current = true;
    const loadHistory = async () => {
      try {
        let data = null;
        try {
          const cloud = await window.storage?.get?.('fen-history');
          if (cloud?.value) data = safeJSONParse(cloud.value, null);
        } catch {
          /* cloud fail silent */
        }

        if (!data) {
          data = getStoredValue('fen-history', null);
        }

        if (Array.isArray(data) && isMountedRef.current) {
          setFenHistory(data);
        }
      } finally {
        if (isMountedRef.current) setIsHydrated(true);
      }
    };
    loadHistory();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => persistHistory(fenHistory));
      } else {
        persistHistory(fenHistory);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fenHistory, isHydrated]);

  const fenIndex = useMemo(
    () => new Map(fenHistory.map((h) => [h.fen, h])),
    [fenHistory]
  );
  const currentIsFavorite = fenIndex.get(fen)?.isFavorite ?? false;
  const lastNotifiedRef = useRef(null);

  useEffect(() => {
    if (isHydrated && lastNotifiedRef.current !== currentIsFavorite) {
      onFavoriteStatusChange?.(currentIsFavorite);
      lastNotifiedRef.current = currentIsFavorite;
    }
  }, [currentIsFavorite, isHydrated, onFavoriteStatusChange]);

  useEffect(() => {
    if (!isHydrated) return;
    const runAutoArchive = async () => {
      try {
        const result = await performAutoArchival();
        if (result.archivedCount > 0 && isMountedRef.current) {
          setFenHistory(result.entries);
          setArchive(result.archive);
        }
      } catch (err) {
        logger.error('Auto-archival failed:', err);
      }
    };

    runAutoArchive();
    const intervalId = setInterval(runAutoArchive, 3600000); // 1 hour
    return () => clearInterval(intervalId);
  }, [isHydrated]);

  useEffect(() => {
    return () => {
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    };
  }, []);

  const commitToHistory = useCallback(
    (fenToSave, source, dragSessionId = null) => {
      if (!validateFEN(fenToSave)) return;
      setFenHistory((prev) => {
        if (prev.length > 0 && prev[0].fen === fenToSave) {
          return prev.map((entry, i) => (i === 0 ? touchEntry(entry) : entry));
        }
        const newEntry = createHistoryEntry(fenToSave, source, dragSessionId);
        return sortByMostRecent([newEntry, ...prev]);
      });
    },
    []
  );

  const saveManualFen = useCallback(
    (fenToSave) => {
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
      dragSessionIdRef.current = null;
      commitToHistory(fenToSave, 'manual');
    },
    [commitToHistory]
  );

  const notifyDragAction = useCallback(() => {
    if (!dragSessionIdRef.current)
      dragSessionIdRef.current = `drag-${Date.now()}`;
    if (dragTimerRef.current) clearTimeout(dragTimerRef.current);

    const sessionId = dragSessionIdRef.current;
    dragTimerRef.current = setTimeout(() => {
      commitToHistory(latestFenRef.current, 'drag', sessionId);
      dragTimerRef.current = null;
      dragSessionIdRef.current = null;
    }, DRAG_INACTIVITY_TIMEOUT);
  }, [commitToHistory]);

  const toggleFavorite = useCallback((id) => {
    setFenHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isFavorite: !h.isFavorite } : h))
    );
  }, []);

  const deleteHistory = useCallback((id) => {
    setFenHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const clearHistory = useCallback(async () => {
    setFenHistory([]);
    window.localStorage.removeItem('fen-history');
    await window.storage?.delete?.('fen-history').catch(() => {});
  }, []);

  const archiveHistoryEntries = useCallback(
    async (ids) => {
      const toArchive = fenHistoryRef.current.filter((e) => ids.includes(e.id));
      const remaining = fenHistoryRef.current.filter(
        (e) => !ids.includes(e.id)
      );
      try {
        const { archive: newArchive } = await archiveEntriesUtil(
          toArchive,
          archive,
          'manual'
        );
        setFenHistory(remaining);
        setArchive(newArchive);
      } catch (err) {
        logger.error(err);
      }
    },
    [archive]
  );

  const addCurrentToFavorites = useCallback(
    async (currentFen, onNotification) => {
      if (!validateFEN(currentFen)) {
        onNotification?.('Invalid FEN - cannot add to favorites', 'error');
        return;
      }
      const existingItem = fenHistoryRef.current.find(
        (h) => h.fen === currentFen
      );
      if (existingItem) {
        const isFav = !existingItem.isFavorite;
        onNotification?.(
          isFav ? 'Added to favorites' : 'Removed from favorites',
          'success'
        );
      } else {
        onNotification?.('Added to favorites ★', 'success');
      }
      setFenHistory((prev) => {
        const existing = prev.find((h) => h.fen === currentFen);
        if (existing) {
          return prev.map((h) =>
            h.fen === currentFen
              ? {
                  ...h,
                  isFavorite: !h.isFavorite,
                  lastActiveAt: Date.now()
                }
              : h
          );
        }
        const newEntry = createHistoryEntry(currentFen, 'manual');
        newEntry.isFavorite = true;
        return sortByMostRecent([newEntry, ...prev]);
      });
    },
    []
  );

  const reactivateArchivedEntry = useCallback(
    async (id) => {
      try {
        const { entry, archive: newArchive } = await reactivateEntryUtil(
          id,
          archive
        );
        setArchive(newArchive);
        setFenHistory((prev) => sortByMostRecent([entry, ...prev]));
      } catch (err) {
        logger.error('Failed to reactivate entry:', err);
        throw err;
      }
    },
    [archive]
  );

  const deleteFromArchive = useCallback(
    async (id) => {
      try {
        const newArchive = await deleteArchivedEntryUtil(id, archive);
        setArchive(newArchive);
      } catch (err) {
        logger.error('Failed to delete from archive:', err);
        throw err;
      }
    },
    [archive]
  );

  const clearArchiveData = useCallback(async () => {
    try {
      await clearArchiveUtil();
      setArchive([]);
    } catch (err) {
      logger.error('Failed to clear archive:', err);
      throw err;
    }
  }, []);

  const saveExportFen = useCallback(
    (f) => commitToHistory(f, 'export'),
    [commitToHistory]
  );

  return {
    fenHistory: useMemo(
      () => applyFilters(fenHistory, filters),
      [fenHistory, filters]
    ),
    rawHistory: fenHistory,
    archive: useMemo(
      () => applyFilters(archive, archiveFilters),
      [archive, archiveFilters]
    ),
    rawArchive: archive,
    isLoadingArchive,
    toggleFavorite,
    deleteHistory,
    clearHistory,
    addCurrentToFavorites,
    saveManualFen,
    saveExportFen,
    notifyDragAction,
    archiveHistoryEntries,
    reactivateArchivedEntry,
    deleteFromArchive,
    clearArchiveData,
    loadArchiveData: useCallback(async () => {
      setIsLoadingArchive(true);
      try {
        setArchive(await loadArchive());
      } finally {
        setIsLoadingArchive(false);
      }
    }, []),
    setHistoryFilters: setFilters,
    setArchiveFilters: setArchiveFilters,
    calculateStatus
  };
}
