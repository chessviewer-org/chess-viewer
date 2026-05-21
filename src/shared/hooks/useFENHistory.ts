import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { syncStorage } from '@/features/auth/services/syncStorage';
import { validateFEN } from '@utils';
import {
  archiveEntries as archiveEntriesUtil,
  clearArchive as clearArchiveUtil,
  deleteArchivedEntry as deleteArchivedEntryUtil,
  loadArchive,
  performAutoArchival,
  reactivateEntry as reactivateEntryUtil
} from '@utils/archiveManager';
import {
  applyFilters,
  calculateStatus,
  createHistoryEntry,
  sortByMostRecent,
  touchEntry
} from '@utils/historyUtils';
import { logger } from '@utils/logger';
import { safeJSONParse } from '@utils/validation';
import {
  ActiveHistoryEntry,
  ArchivedHistoryEntry,
  HistoryFilters,
  FreshnessStatus,
  HistorySource
} from '@app-types/history';

const DRAG_INACTIVITY_TIMEOUT = 60000;

/**
 * Persists history to local storage and cloud sync.
 *
 * @param history - The list of active history entries to save
 */
const persistHistory = (history: ActiveHistoryEntry[]): void => {
  try {
    const jsonData = JSON.stringify(history);
    window.localStorage.setItem('fen-history', jsonData);
    if (syncStorage) {
      syncStorage
        .set('fen-history', jsonData)
        .catch((err: Error) => logger.error('Cloud save failed:', err));
    }
  } catch (err) {
    logger.error('Failed to save history:', err);
  }
};

export interface UseFENHistoryResult {
  fenHistory: ActiveHistoryEntry[];
  rawHistory: ActiveHistoryEntry[];
  archive: ArchivedHistoryEntry[];
  rawArchive: ArchivedHistoryEntry[];
  isLoadingArchive: boolean;
  toggleFavorite: (id: number) => void;
  deleteHistory: (id: number) => void;
  clearHistory: () => Promise<void>;
  addCurrentToFavorites: (
    currentFen: string,
    onNotification?: (message: string, type: 'error' | 'success') => void
  ) => Promise<void>;
  saveManualFen: (fenToSave: string) => void;
  saveExportFen: (f: string) => void;
  notifyDragAction: () => void;
  archiveHistoryEntries: (ids: number[]) => Promise<void>;
  reactivateArchivedEntry: (id: number) => Promise<void>;
  deleteFromArchive: (id: number) => Promise<void>;
  clearArchiveData: () => Promise<void>;
  loadArchiveData: () => Promise<void>;
  setHistoryFilters: React.Dispatch<React.SetStateAction<HistoryFilters>>;
  setArchiveFilters: React.Dispatch<React.SetStateAction<HistoryFilters>>;
  calculateStatus: (
    entry: ActiveHistoryEntry | ArchivedHistoryEntry
  ) => FreshnessStatus;
}

/**
 * Custom hook for managing FEN history, favorites, and archiving.
 *
 * @param fen - The current FEN string on the board
 * @param onFavoriteStatusChange - Callback fired when the current FEN's favorite status changes
 * @returns State and handlers for FEN history management
 */
export function useFENHistory(
  fen: string,
  onFavoriteStatusChange?: (isFavorite: boolean) => void
): UseFENHistoryResult {
  const [fenHistory, setFenHistory] = useState<ActiveHistoryEntry[]>([]);
  const [archive, setArchive] = useState<ArchivedHistoryEntry[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [archiveFilters, setArchiveFilters] = useState<HistoryFilters>({});
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragSessionIdRef = useRef<string | null>(null);
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
    /** Loads initial history from cloud or local storage. */
    const loadHistoryData = async () => {
      try {
        let data: ActiveHistoryEntry[] | null = null;
        try {
          const cloud = await syncStorage.get('fen-history');
          if (cloud?.value)
            data = safeJSONParse<ActiveHistoryEntry[]>(cloud.value, []);
        } catch {
          // Cloud failure is handled silently, fallback to local
        }

        if (!data) {
          const local = window.localStorage.getItem('fen-history');
          if (local) data = safeJSONParse<ActiveHistoryEntry[]>(local, []);
        }

        if (Array.isArray(data) && isMountedRef.current) {
          setFenHistory(data);
        }
      } finally {
        if (isMountedRef.current) setIsHydrated(true);
      }
    };
    loadHistoryData();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window && window.requestIdleCallback) {
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
  const lastNotifiedRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (isHydrated && lastNotifiedRef.current !== currentIsFavorite) {
      onFavoriteStatusChange?.(currentIsFavorite);
      lastNotifiedRef.current = currentIsFavorite;
    }
  }, [currentIsFavorite, isHydrated, onFavoriteStatusChange]);

  useEffect(() => {
    if (!isHydrated) return;
    /** Automatically archives old entries. */
    const runAutoArchive = async () => {
      try {
        const result = await performAutoArchival(fenHistory);
        if (result.archivedCount > 0 && isMountedRef.current) {
          setFenHistory(result.updatedHistory);
        }
      } catch (err) {
        logger.error('Auto-archival failed:', err);
      }
    };

    runAutoArchive();
    const intervalId = setInterval(runAutoArchive, 3600000); 
    return () => clearInterval(intervalId);
  }, [isHydrated, fenHistory]);

  useEffect(() => {
    return () => {
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    };
  }, []);

  /** 
   * Internal helper to add or update a FEN entry in history. 
   * 
   * @param fenToSave - FEN string to record
   * @param source - The source of the action
   * @param dragSessionId - Optional session ID for drag operations
   */
  const commitToHistory = useCallback(
    (
      fenToSave: string,
      source: HistorySource,
      dragSessionId: string | null = null
    ) => {
      if (!validateFEN(fenToSave)) return;
      setFenHistory((prev) => {
        if (prev.length > 0 && prev[0]?.fen === fenToSave) {
          return prev.map((entry, i) => (i === 0 ? touchEntry(entry) : entry));
        }
        const newEntry = createHistoryEntry(
          fenToSave,
          source,
          dragSessionId || undefined
        );
        return sortByMostRecent([newEntry, ...prev]);
      });
    },
    []
  );

  /** 
   * Saves a FEN entered manually by the user. 
   * 
   * @param fenToSave - FEN string
   */
  const saveManualFen = useCallback(
    (fenToSave: string) => {
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
      dragSessionIdRef.current = null;
      commitToHistory(fenToSave, 'manual');
    },
    [commitToHistory]
  );

  /** 
   * Records a board change caused by dragging pieces, using a debounce timeout. 
   */
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

  /** 
   * Toggles the favorite status of a history entry. 
   * 
   * @param id - Entry ID
   */
  const toggleFavorite = useCallback((id: number) => {
    setFenHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isFavorite: !h.isFavorite } : h))
    );
  }, []);

  /** 
   * Removes an entry from the history list. 
   * 
   * @param id - Entry ID
   */
  const deleteHistory = useCallback((id: number) => {
    setFenHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  /** 
   * Clears the entire history list from memory and storage. 
   */
  const clearHistory = useCallback(async () => {
    setFenHistory([]);
    window.localStorage.removeItem('fen-history');
    await syncStorage.delete('fen-history').catch(() => {});
  }, []);

  /** 
   * Manually moves selected entries to the archive. 
   * 
   * @param ids - Array of entry IDs to archive
   */
  const archiveHistoryEntries = useCallback(
    async (ids: number[]) => {
      const toArchive = fenHistoryRef.current
        .filter((e) => ids.includes(e.id))
        .map(e => ({ ...e, archivedAt: Date.now(), archiveSource: 'manual' } as ArchivedHistoryEntry));
        
      const remaining = fenHistoryRef.current.filter(
        (e) => !ids.includes(e.id)
      );
      try {
        await archiveEntriesUtil(toArchive);
        setFenHistory(remaining);
      } catch (err) {
        logger.error('Manual archive failed:', err);
      }
    },
    []
  );

  /** 
   * Adds the current position to favorites, creating a history entry if needed. 
   * 
   * @param currentFen - The position to favorite
   * @param onNotification - Optional feedback callback
   */
  const addCurrentToFavorites = useCallback(
    async (
      currentFen: string,
      onNotification?: (message: string, type: 'error' | 'success') => void
    ) => {
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

  /** 
   * Restores an entry from the archive back to active history. 
   * 
   * @param id - Archived entry ID
   */
  const reactivateArchivedEntry = useCallback(
    async (id: number) => {
      try {
        const entry = archive.find(e => e.id === id);
        if (!entry) throw new Error('Entry not found in archive');
        const updatedArchive = await reactivateEntryUtil(id);
        setArchive(updatedArchive);
        setFenHistory((prev) => sortByMostRecent([{
          id: entry.id,
          fen: entry.fen,
          createdAt: entry.createdAt,
          lastActiveAt: Date.now(),
          source: entry.source,
          isFavorite: entry.isFavorite
        }, ...prev]));
      } catch (err) {
        logger.error('Failed to reactivate entry:', err);
        throw err;
      }
    },
    [archive]
  );

  /** 
   * Permanently deletes an entry from the archive. 
   * 
   * @param id - Archived entry ID
   */
  const deleteFromArchive = useCallback(
    async (id: number) => {
      try {
        const updatedArchive = await deleteArchivedEntryUtil(id);
        setArchive(updatedArchive);
      } catch (err) {
        logger.error('Failed to delete from archive:', err);
        throw err;
      }
    },
    []
  );

  /** 
   * Clears all entries in the archive. 
   */
  const clearArchiveData = useCallback(async () => {
    try {
      await clearArchiveUtil();
      setArchive([]);
    } catch (err) {
      logger.error('Failed to clear archive:', err);
      throw err;
    }
  }, []);

  /** 
   * Records a history entry when a position is exported. 
   * 
   * @param f - FEN string
   */
  const saveExportFen = useCallback(
    (f: string) => commitToHistory(f, 'export'),
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
    calculateStatus: (entry: ActiveHistoryEntry | ArchivedHistoryEntry) =>
      calculateStatus(entry.lastActiveAt)
  };
}
