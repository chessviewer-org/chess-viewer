import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import type { HistoryFilterState } from '@/components/features/History';
import { useModal } from '@contexts';
import { useFENHistory } from '@hooks';
import { ActiveHistoryEntry, HistoryFilters } from '@app-types';

import { logger, safeJSONParse } from '@utils';

/** Union of available history tab identifiers. */
export type TabType = 'active' | 'favorites' | 'archive';

/** Manages tab state, filters, delete confirmation, and board theme sync for FENHistoryPage. */
export const useFENHistoryPage = () => {
  const navigate = useNavigate();
  const { showConfirm } = useModal();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [filters, setFilters] = useState<HistoryFilterState>({});
  const [favoritesFilters, setFavoritesFilters] = useState<HistoryFilterState>(
    {}
  );
  const [archiveFilters, setArchiveFilters] = useState<HistoryFilterState>({});
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [doNotAskAgain, setDoNotAskAgain] = useState<boolean>(() => {
    return localStorage.getItem('fen-history-skip-delete-confirm') === 'true';
  });

  const {
    fenHistory,
    archive,
    isLoadingArchive,
    toggleFavorite,
    clearHistory,
    loadArchiveData,
    reactivateArchivedEntry,
    deleteFromArchive,
    archiveHistoryEntries,
    setHistoryFilters,
    setArchiveFilters: setArchiveFiltersHook
  } = useFENHistory('');

  useEffect(() => {
    if (activeTab === 'archive' && archive.length === 0 && !isLoadingArchive) {
      loadArchiveData();
    }
  }, [activeTab, archive.length, isLoadingArchive, loadArchiveData]);

  useEffect(() => {
    setHistoryFilters(filters as HistoryFilters);
  }, [filters, setHistoryFilters]);

  useEffect(() => {
    setArchiveFiltersHook(archiveFilters as HistoryFilters);
  }, [archiveFilters, setArchiveFiltersHook]);

  const [lightSquare, setLightSquare] = useState<string>(() =>
    safeJSONParse(localStorage.getItem('chess-light-square'), '#f0d9b5')
  );
  const [darkSquare, setDarkSquare] = useState<string>(() =>
    safeJSONParse(localStorage.getItem('chess-dark-square'), '#b58863')
  );
  const [pieceStyle, setPieceStyle] = useState<string>(() =>
    safeJSONParse(localStorage.getItem('chess-piece-style'), 'cburnett')
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setLightSquare(
        safeJSONParse(localStorage.getItem('chess-light-square'), '#f0d9b5')
      );
      setDarkSquare(
        safeJSONParse(localStorage.getItem('chess-dark-square'), '#b58863')
      );
      setPieceStyle(
        safeJSONParse(localStorage.getItem('chess-piece-style'), 'cburnett')
      );
    };

    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleLoad = useCallback(
    (fen: string) => {
      navigate('/', { state: { loadFEN: fen } });
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        if (activeTab === 'archive') {
          if (doNotAskAgain) {
            await deleteFromArchive(id);
          } else {
            setDeleteTargetId(id);
            setShowDeleteModal(true);
          }
        } else {
          await archiveHistoryEntries([id]);
        }
      } catch (err: unknown) {
        logger.error('Failed to delete:', err);
      }
    },
    [activeTab, deleteFromArchive, archiveHistoryEntries, doNotAskAgain]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;

    try {
      await deleteFromArchive(deleteTargetId);
      setDeleteTargetId(null);
      setShowDeleteModal(false);
    } catch (err: unknown) {
      logger.error('Failed to delete from archive:', err);
    }
  }, [deleteTargetId, deleteFromArchive]);

  const handleDoNotAskAgainChange = useCallback((checked: boolean) => {
    setDoNotAskAgain(checked);
    localStorage.setItem('fen-history-skip-delete-confirm', checked.toString());
  }, []);

  const handleToggleFavorite = useCallback(
    async (id: number) => {
      try {
        await toggleFavorite(id);
      } catch (err: unknown) {
        logger.error('Failed to toggle favorite:', err);
      }
    },
    [toggleFavorite]
  );

  const handleClearAll = useCallback(async () => {
    const confirmed = await showConfirm(
      'Clear History',
      'Clear all FEN history? This cannot be undone.',
      'danger'
    );

    if (confirmed) {
      try {
        await clearHistory();
      } catch (err: unknown) {
        logger.error('Failed to clear history:', err);
      }
    }
  }, [clearHistory, showConfirm]);

  const handleReactivate = useCallback(
    async (id: number) => {
      try {
        await reactivateArchivedEntry(id);
        setActiveTab('active');
      } catch (err: unknown) {
        logger.error('Failed to reactivate:', err);
      }
    },
    [reactivateArchivedEntry]
  );

  // Stable memoized favorites — new array reference only when fenHistory changes.
  // Without useMemo the IIFE produces a new array every render, which makes
  // FENHistoryGrid's `useEffect([data])` reset pagination on every re-render.
  const favoritesData = useMemo(() => {
    const favorites = fenHistory.filter(
      (entry: ActiveHistoryEntry) => entry.isFavorite
    );
    const sorted = [...favorites].sort(
      (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
    );
    const seen = new Set<string>();
    const unique: ActiveHistoryEntry[] = [];
    for (const entry of sorted) {
      const key = entry.fen.split(' ')[0] ?? entry.fen;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(entry);
    }
    return unique;
  }, [fenHistory]);

  const filteredFavorites = useMemo(() => {
    let filtered = favoritesData;

    if (favoritesFilters.fenSearch) {
      filtered = filtered.filter((entry) =>
        entry.fen
          .toLowerCase()
          .includes(favoritesFilters.fenSearch?.toLowerCase() || '')
      );
    }

    if (favoritesFilters.source) {
      filtered = filtered.filter(
        (entry) => entry.source === favoritesFilters.source
      );
    }

    if (favoritesFilters.dateFrom !== undefined) {
      filtered = filtered.filter(
        (entry) => entry.createdAt >= (favoritesFilters.dateFrom || 0)
      );
    }

    if (favoritesFilters.dateTo !== undefined) {
      filtered = filtered.filter(
        (entry) => entry.createdAt <= (favoritesFilters.dateTo || Infinity)
      );
    }

    return filtered;
  }, [favoritesData, favoritesFilters]);

  const currentData =
    activeTab === 'archive'
      ? archive
      : activeTab === 'favorites'
        ? filteredFavorites
        : fenHistory;

  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  return {
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    favoritesFilters,
    setFavoritesFilters,
    archiveFilters,
    setArchiveFilters,
    showDeleteModal,
    setShowDeleteModal,
    doNotAskAgain,
    handleDoNotAskAgainChange,
    handleConfirmDelete,
    lightSquare,
    darkSquare,
    pieceStyle,
    handleBack,
    handleLoad,
    handleDelete,
    handleToggleFavorite,
    handleClearAll,
    handleReactivate,
    currentData,
    fenHistory,
    favoritesData,
    archive,
    formatDate,
    formatTime
  };
};
