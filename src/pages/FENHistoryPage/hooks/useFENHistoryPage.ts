import { useLocation } from 'wouter';
import { useEffect, useMemo, useState } from 'react';

import type { HistoryFilterState } from '@/components/features/History';
import {
  useBoardPieceSet,
  useEscapeKey,
  useFENHistory,
  useSyncedBoardColors
} from '@hooks';
import { ActiveHistoryEntry, HistoryFilters } from '@app-types';

import { logger } from '@utils';

// Types
export type TabType = 'active' | 'favorites' | 'archive';

export const useFENHistoryPage = () => {
  // State
  const [, navigate] = useLocation();
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

  const [lightSquare, setLightSquare] = useState('#f0d9b5');
  const [darkSquare, setDarkSquare] = useState('#b58863');
  const [pieceStyle] = useBoardPieceSet();

  useSyncedBoardColors(setLightSquare, setDarkSquare);

  // Handlers
  function handleBack() {
    window.history.back();
  }

  function handleLoad(fen: string) {
    navigate('/', { state: { loadFEN: fen } });
  }

  async function handleDelete(id: number) {
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
  }

  async function handleConfirmDelete() {
    if (!deleteTargetId) return;

    try {
      await deleteFromArchive(deleteTargetId);
      setDeleteTargetId(null);
      setShowDeleteModal(false);
    } catch (err: unknown) {
      logger.error('Failed to delete from archive:', err);
    }
  }

  function handleDoNotAskAgainChange(checked: boolean) {
    setDoNotAskAgain(checked);
    localStorage.setItem('fen-history-skip-delete-confirm', checked.toString());
  }

  async function handleToggleFavorite(id: number) {
    try {
      await toggleFavorite(id);
    } catch (err: unknown) {
      logger.error('Failed to toggle favorite:', err);
    }
  }

  async function handleReactivate(id: number) {
    try {
      await reactivateArchivedEntry(id);
      setActiveTab('active');
    } catch (err: unknown) {
      logger.error('Failed to reactivate:', err);
    }
  }

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

  function formatDate(timestamp: number) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  function formatTime(timestamp: number) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  useEscapeKey(handleBack);

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
    handleLoad,
    handleDelete,
    handleToggleFavorite,
    handleReactivate,
    currentData,
    fenHistory,
    favoritesData,
    archive,
    formatDate,
    formatTime
  };
};
