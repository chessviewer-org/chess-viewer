import { memo, useCallback, useEffect, useState } from 'react';

import {
  Archive as ArchiveIcon,
  ArrowLeft,
  Clock,
  Star,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { MiniPreview } from '@/components/board';
import {
  ConfirmationModal,
  HistoryFilters,
  StatusBadge
} from '@/components/features/History';
import { useFENHistory } from '@/hooks';
import { logger } from '@/utils/logger';
import { getStoredBoolean, getStoredString } from '@/utils/validation';

/**
 * Full-page FEN history manager with tabs for active entries, favorites, and archive.
 * @returns {JSX.Element}
 */
const FENHistoryPage = memo(function FENHistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [filters, setFilters] = useState({});
  const [favoritesFilters, setFavoritesFilters] = useState({});
  const [archiveFilters, setArchiveFilters] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [doNotAskAgain, setDoNotAskAgain] = useState(() => {
    return getStoredBoolean('fen-history-skip-delete-confirm', false);
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
  } = useFENHistory('', null);

  useEffect(() => {
    if (activeTab === 'archive' && archive.length === 0 && !isLoadingArchive) {
      loadArchiveData();
    }
  }, [activeTab, archive.length, isLoadingArchive, loadArchiveData]);

  useEffect(() => {
    setHistoryFilters(filters);
  }, [filters, setHistoryFilters]);

  useEffect(() => {
    setArchiveFiltersHook(archiveFilters);
  }, [archiveFilters, setArchiveFiltersHook]);

  const [lightSquare, setLightSquare] = useState(() =>
    getStoredString('chess-light-square', '#f0d9b5')
  );
  const [darkSquare, setDarkSquare] = useState(() =>
    getStoredString('chess-dark-square', '#b58863')
  );
  const [pieceStyle, setPieceStyle] = useState(() =>
    getStoredString('chess-piece-style', 'cburnett')
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setLightSquare(getStoredString('chess-light-square', '#f0d9b5'));
      setDarkSquare(getStoredString('chess-dark-square', '#b58863'));
      setPieceStyle(getStoredString('chess-piece-style', 'cburnett'));
    };

    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Navigates back in browser history.
   */
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * Navigates to the home page with the selected FEN pre-loaded.
   * @param {string} fen - FEN string to load on the home page
   */
  const handleLoad = useCallback(
    (fen) => {
      navigate('/', { state: { loadFEN: fen } });
    },
    [navigate]
  );

  /**
   * Deletes or archives a history entry depending on the active tab.
   * Archive-tab entries prompt a confirmation modal; active/favorites entries move to archive.
   * @param {number} id - Entry ID to delete or archive
   * @returns {Promise<void>}
   */
  const handleDelete = useCallback(
    async (id) => {
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
      } catch (err) {
        logger.error('Failed to delete:', err);
      }
    },
    [activeTab, deleteFromArchive, archiveHistoryEntries, doNotAskAgain]
  );

  /**
   * Confirm permanent deletion from archive
   * @returns {Promise<void>}
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetId) return;

    try {
      await deleteFromArchive(deleteTargetId);
      setDeleteTargetId(null);
    } catch (err) {
      logger.error('Failed to delete from archive:', err);
    }
  }, [deleteTargetId, deleteFromArchive]);

  /**
   * Handle "Do not ask again" checkbox
   * @param {boolean} checked - Checkbox state
   * @returns {void}
   */
  const handleDoNotAskAgainChange = useCallback((checked) => {
    setDoNotAskAgain(checked);
    localStorage.setItem('fen-history-skip-delete-confirm', checked.toString());
  }, []);

  /**
   * Toggles the favorite status of a history entry.
   * @param {number} id - Entry ID to toggle
   * @returns {Promise<void>}
   */
  const handleToggleFavorite = useCallback(
    async (id) => {
      try {
        await toggleFavorite(id);
      } catch (err) {
        logger.error('Failed to toggle favorite:', err);
      }
    },
    [toggleFavorite]
  );

  /**
   * Clears all active history entries after user confirmation.
   * @returns {Promise<void>}
   */
  const handleClearAll = useCallback(async () => {
    if (window.confirm('Clear all FEN history? This cannot be undone.')) {
      try {
        await clearHistory();
      } catch (err) {
        logger.error('Failed to clear history:', err);
      }
    }
  }, [clearHistory]);

  /**
   * Restores an archived entry to the active history tab.
   * @param {number} id - Archived entry ID to reactivate
   * @returns {Promise<void>}
   */
  const handleReactivate = useCallback(
    async (id) => {
      try {
        await reactivateArchivedEntry(id);
        setActiveTab('active');
      } catch (err) {
        logger.error('Failed to reactivate:', err);
      }
    },
    [reactivateArchivedEntry]
  );

  const favoritesData = fenHistory.filter((entry) => entry.isFavorite);

  /**
   * Applies text, source, and date filters to a list of favorite entries.
   * @param {Array} entries - Entries to filter
   * @returns {Array} Filtered entries
   */
  const applyFavoritesFilters = useCallback(
    (entries) => {
      let filtered = entries;

      if (favoritesFilters.fenSearch) {
        filtered = filtered.filter((entry) =>
          entry.fen
            .toLowerCase()
            .includes(favoritesFilters.fenSearch.toLowerCase())
        );
      }

      if (favoritesFilters.source) {
        filtered = filtered.filter(
          (entry) => entry.source === favoritesFilters.source
        );
      }

      if (favoritesFilters.dateFrom) {
        filtered = filtered.filter(
          (entry) => entry.createdAt >= favoritesFilters.dateFrom
        );
      }

      if (favoritesFilters.dateTo) {
        filtered = filtered.filter(
          (entry) => entry.createdAt <= favoritesFilters.dateTo
        );
      }

      return filtered;
    },
    [favoritesFilters]
  );

  const filteredFavorites = applyFavoritesFilters(favoritesData);

  const currentData =
    activeTab === 'archive'
      ? archive
      : activeTab === 'favorites'
        ? filteredFavorites
        : fenHistory;

  /**
   * Formats a timestamp as `DD.MM.YYYY`.
   * @param {number} timestamp - Unix ms timestamp
   * @returns {string} Formatted date string
   */
  const formatDate = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }, []);

  /**
   * Formats a timestamp as `HH:mm` (24-hour clock).
   * @param {number} timestamp - Unix ms timestamp
   * @returns {string} Formatted time string
   */
  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  return (
    <div className="h-full max-h-full flex flex-col bg-bg overflow-hidden">
      <header className="flex-shrink-0 bg-surface border-b border-border animate-pageEnter">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 hover:bg-surface-hover rounded-xl transition-colors duration-200 group"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-accent group-hover:text-accent-hover transition-colors duration-200" />
                <span className="text-xs sm:text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-200">
                  Back
                </span>
              </button>
              <div className="h-6 sm:h-8 w-px bg-border/50 hidden sm:block" />
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-accent animate-iconBounceIn" />
                <h1 className="text-lg sm:text-2xl font-display font-bold text-text-primary animate-fadeIn">
                  FEN History
                </h1>
              </div>
              <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-surface-elevated text-text-secondary text-xs font-medium rounded-full animate-numberRoll">
                {currentData.length}
              </span>
            </div>

            {currentData.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-error hover:bg-error/10 rounded-xl transition-colors duration-200"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-2 sm:py-2.5 border-t border-border/50">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                activeTab === 'active'
                  ? 'bg-accent text-bg shadow-sm'
                  : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Active ({fenHistory.length})
              </span>
            </button>

            <div className="w-px h-7 bg-border/50" />

            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                activeTab === 'favorites'
                  ? 'bg-accent text-bg shadow-sm'
                  : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Favorites ({favoritesData.length})
              </span>
            </button>

            <div className="w-px h-7 bg-border/50" />

            <button
              onClick={() => setActiveTab('archive')}
              className={`flex-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
                activeTab === 'archive'
                  ? 'bg-accent text-bg shadow-sm'
                  : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <ArchiveIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Archive ({archive.length})
              </span>
            </button>
          </div>
        </div>
      </header>

      <HistoryFilters
        filters={
          activeTab === 'archive'
            ? archiveFilters
            : activeTab === 'favorites'
              ? favoritesFilters
              : filters
        }
        onFiltersChange={
          activeTab === 'archive'
            ? setArchiveFilters
            : activeTab === 'favorites'
              ? setFavoritesFilters
              : setFilters
        }
        showStatus={activeTab === 'active'}
        showFavoritesCheckbox={activeTab === 'active'}
      />

      <main className="flex-1">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {currentData.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto animate-fadeInScale">
              <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-base sm:text-lg font-medium">
                {activeTab === 'archive'
                  ? 'No archived positions yet'
                  : activeTab === 'favorites'
                    ? 'No favorite positions yet'
                    : 'No FEN history yet'}
              </p>
              <p className="text-text-muted text-xs sm:text-sm mt-1.5">
                {activeTab === 'archive'
                  ? 'Positions older than 90 days are automatically archived'
                  : activeTab === 'favorites'
                    ? 'Star positions to mark them as favorites'
                    : 'Load FEN positions to build your history'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {currentData.map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-accent/5 hover:border-accent/30 transition-all duration-200 group flex flex-col min-h-[200px] animate-cardReveal"
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
                >
                  <div className="aspect-square bg-bg/30 p-2 flex-shrink-0 border-b border-border/30">
                    <div className="w-full h-full overflow-hidden">
                      <MiniPreview
                        fen={entry.fen}
                        lightSquare={lightSquare}
                        darkSquare={darkSquare}
                        pieceStyle={pieceStyle}
                      />
                    </div>
                  </div>

                  <div className="p-3 flex flex-col flex-1 min-h-0">
                    <div className="font-mono text-[10px] sm:text-xs text-text-muted/70 truncate mb-2">
                      {entry.fen.split(' ')[0]}
                    </div>

                    {activeTab === 'active' && entry.lastActiveAt && (
                      <div className="mb-2">
                        <StatusBadge lastActiveAt={entry.lastActiveAt} />
                      </div>
                    )}

                    <div className="flex-1"></div>

                    <div className="flex flex-col gap-2">
                      {(entry.createdAt ||
                        entry.timestamp ||
                        entry.archivedAt) && (
                        <div className="text-[10px] sm:text-xs text-text-muted/60 flex items-center gap-1 font-medium">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 opacity-50" />
                          <span>
                            {formatDate(
                              entry.createdAt ||
                                entry.timestamp ||
                                entry.archivedAt
                            )}
                          </span>
                          <span className="opacity-40">•</span>
                          <span>
                            {formatTime(
                              entry.createdAt ||
                                entry.timestamp ||
                                entry.archivedAt
                            )}
                          </span>
                        </div>
                      )}

                      {activeTab === 'archive' ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleReactivate(entry.id)}
                            className="flex-1 px-2.5 py-2 bg-accent hover:bg-accent-hover text-bg text-xs font-semibold rounded-lg transition-all"
                          >
                            Reactivate
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 hover:bg-error/10 text-text-muted hover:text-error rounded-lg transition-all"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleLoad(entry.fen)}
                            className="flex-1 px-2.5 py-2 bg-accent hover:bg-accent-hover text-bg text-xs font-semibold rounded-lg transition-all shadow-sm"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleToggleFavorite(entry.id)}
                            className={`p-2 rounded-lg transition-all ${
                              entry.isFavorite
                                ? 'bg-warning/15 text-warning'
                                : 'hover:bg-warning/10 text-text-muted hover:text-warning'
                            }`}
                            aria-label={
                              entry.isFavorite
                                ? 'Remove from favorites'
                                : 'Add to favorites'
                            }
                          >
                            <Star
                              className="w-3.5 h-3.5"
                              fill={entry.isFavorite ? 'currentColor' : 'none'}
                            />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 hover:bg-surface-hover text-text-muted hover:text-text-secondary rounded-lg transition-all"
                            aria-label="Archive"
                          >
                            <ArchiveIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete from Archive"
        message="Are you sure you want to permanently delete this position? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        showDoNotAskAgain={true}
        doNotAskAgain={doNotAskAgain}
        onDoNotAskAgainChange={handleDoNotAskAgainChange}
      />
    </div>
  );
});

FENHistoryPage.displayName = 'FENHistoryPage';

export default FENHistoryPage;
