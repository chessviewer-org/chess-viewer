import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';
import {
  ActiveHistoryEntry,
  ArchivedHistoryEntry,
  FreshnessStatus,
  HistoryFilters,
  HistorySource
} from '@app-types';

import {
  applyFilters,
  archiveEntries as archiveEntriesUtil,
  calculateStatus,
  createHistoryEntry,
  logger,
  performAutoArchival,
  sortByMostRecent,
  touchEntry,
  validateFEN
} from '@utils';
import { useArchiveManager } from './fenHistory/useArchiveManager';
import { useHistoryDragDebounce } from './fenHistory/useHistoryDragDebounce';
import { useHistoryHydration } from './fenHistory/useHistoryHydration';

/** Return type of `useFENHistory` — exposes filtered views, mutation actions, and archive management. */
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
 * Hard cap on the live active history list. Each rendered card mounts its own
 * `<canvas>` thumbnail, so an unbounded list is a Safari/iOS canvas-OOM risk
 * (the FEN History page previously rendered one live canvas per entry with no
 * limit). Auto-archival normally trims the list, but this is the backstop that
 * keeps the in-memory + localStorage list bounded between archival runs.
 */
const MAX_ACTIVE_HISTORY = 200;

/**
 * Bounds the active history to `MAX_ACTIVE_HISTORY` entries without silently
 * dropping favorites: every favorite is retained, and the remaining slots go to
 * the most-recent non-favorites. Input is assumed already most-recent-first.
 */
function capHistory(entries: ActiveHistoryEntry[]): ActiveHistoryEntry[] {
  if (entries.length <= MAX_ACTIVE_HISTORY) return entries;
  const favorites = entries.filter((e) => e.isFavorite);
  if (favorites.length >= MAX_ACTIVE_HISTORY) return favorites;
  const kept = new Set(favorites);
  const result: ActiveHistoryEntry[] = [];
  for (const entry of entries) {
    if (result.length >= MAX_ACTIVE_HISTORY) break;
    if (kept.has(entry) || !entry.isFavorite) result.push(entry);
  }
  return result;
}

/**
 * Manages the FEN position history, including favorites, archival, and filtering.
 *
 * Persists the active list to `localStorage` and syncs bidirectionally with
 * Supabase when a user is authenticated.
 *
 * @param fen - The currently displayed FEN position
 * @param onFavoriteStatusChange - Optional callback fired when the current FEN's favorite status changes
 * @returns History state and all mutation/query actions
 */
export function useFENHistory(
  fen: string,
  onFavoriteStatusChange?: (isFavorite: boolean) => void
): UseFENHistoryResult {
  const [fenHistory, setFenHistory] = useState<ActiveHistoryEntry[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [archiveFilters, setArchiveFilters] = useState<HistoryFilters>({});

  const latestFenRef = useRef(fen);
  const fenHistoryRef = useRef(fenHistory);
  const isMountedRef = useRef(true);

  useEffect(() => {
    latestFenRef.current = fen;
  }, [fen]);

  useEffect(() => {
    fenHistoryRef.current = fenHistory;
  }, [fenHistory]);

  const { isHydrated } = useHistoryHydration(
    fenHistory,
    setFenHistory,
    isMountedRef
  );

  const {
    archive,
    isLoadingArchive,
    loadArchiveData,
    reactivateArchivedEntry,
    deleteFromArchive,
    clearArchiveData
  } = useArchiveManager({ setFenHistory });

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
    const runAutoArchive = async () => {
      try {
        const result = await performAutoArchival(fenHistoryRef.current);
        if (result.archivedCount > 0 && isMountedRef.current) {
          setFenHistory(result.updatedHistory);
        }
      } catch (err: unknown) {
        logger.error('Auto-archival failed:', err);
      }
    };

    runAutoArchive();
    const intervalId = setInterval(runAutoArchive, 3600000);
    return () => clearInterval(intervalId);
  }, [isHydrated]);

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
        return capHistory(sortByMostRecent([newEntry, ...prev]));
      });
    },
    []
  );

  const { notifyDragAction, cancelDragTimer } = useHistoryDragDebounce({
    commitToHistory,
    latestFenRef
  });

  const saveManualFen = useCallback(
    (fenToSave: string) => {
      cancelDragTimer();
      commitToHistory(fenToSave, 'manual');
    },
    [commitToHistory, cancelDragTimer]
  );

  const toggleFavorite = useCallback((id: number) => {
    setFenHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isFavorite: !h.isFavorite } : h))
    );
  }, []);

  const deleteHistory = useCallback((id: number) => {
    setFenHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const clearHistory = useCallback(async () => {
    setFenHistory([]);
    window.localStorage.removeItem('fen-history');
    await syncStorage.delete('fen-history').catch(() => {});
  }, []);

  const archiveHistoryEntries = useCallback(async (ids: number[]) => {
    const toArchive = fenHistoryRef.current
      .filter((e) => ids.includes(e.id))
      .map(
        (e) =>
          ({
            ...e,
            archivedAt: Date.now(),
            archiveSource: 'manual'
          }) as ArchivedHistoryEntry
      );

    const remaining = fenHistoryRef.current.filter((e) => !ids.includes(e.id));
    try {
      await archiveEntriesUtil(toArchive);
      setFenHistory(remaining);
    } catch (err: unknown) {
      logger.error('Manual archive failed:', err);
    }
  }, []);

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
        return capHistory(sortByMostRecent([newEntry, ...prev]));
      });
    },
    []
  );

  const saveExportFen = useCallback(
    (f: string) => commitToHistory(f, 'export'),
    [commitToHistory]
  );

  const filteredHistory = useMemo(
    () => applyFilters(fenHistory, filters),
    [fenHistory, filters]
  );
  const filteredArchive = useMemo(
    () => applyFilters(archive, archiveFilters),
    [archive, archiveFilters]
  );

  const calculateStatusCb = useCallback(
    (entry: ActiveHistoryEntry | ArchivedHistoryEntry) =>
      calculateStatus(entry.lastActiveAt),
    []
  );

  return useMemo(
    () => ({
      fenHistory: filteredHistory,
      rawHistory: fenHistory,
      archive: filteredArchive,
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
      loadArchiveData,
      setHistoryFilters: setFilters,
      setArchiveFilters,
      calculateStatus: calculateStatusCb
    }),
    [
      filteredHistory,
      fenHistory,
      filteredArchive,
      archive,
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
      loadArchiveData,
      calculateStatusCb
    ]
  );
}
