import React, { memo, useMemo } from 'react';

import { Clock, Inbox, Star } from 'lucide-react';

import {
  ConfirmationModal,
  HistoryFilters
} from '@/components/features/History';
import { type PageTabGroup, PageTabs } from '@/components/layout';
import { getRouteSeo, SOFTWARE_APP_SCHEMA } from '@constants';

import { Seo } from '@shared/ui';
import { FENHistoryEmptyState } from './components/FENHistoryEmptyState';
import { FENHistoryGrid } from './components/FENHistoryGrid';
import { type TabType, useFENHistoryPage } from './hooks/useFENHistoryPage';

/** Paginated grid view of saved FEN positions across active, favorites, and archive tabs. */
const FENHistoryPage: React.FC = memo(() => {
  const {
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
  } = useFENHistoryPage();

  const historyGroups: PageTabGroup[] = useMemo(
    () => [
      {
        items: [
          {
            id: 'active',
            label: `Active (${fenHistory.length.toString()})`,
            icon: Clock
          },
          {
            id: 'favorites',
            label: `Favorites (${favoritesData.length.toString()})`,
            icon: Star
          },
          {
            id: 'archive',
            label: `Archive (${archive.length.toString()})`,
            icon: Inbox
          }
        ]
      }
    ],
    [fenHistory.length, favoritesData.length, archive.length]
  );

  const activeFilters =
    activeTab === 'archive'
      ? archiveFilters
      : activeTab === 'favorites'
        ? favoritesFilters
        : filters;

  const activeFiltersChange =
    activeTab === 'archive'
      ? setArchiveFilters
      : activeTab === 'favorites'
        ? setFavoritesFilters
        : setFilters;

  return (
    <div
      data-page-scroll
      className="min-h-full bg-bg md:h-full md:max-h-full md:overflow-y-auto animate-pageEnter"
    >
      <Seo {...getRouteSeo('/fen-history')} schema={SOFTWARE_APP_SCHEMA} />

      <div className="page-container flex flex-col gap-6 py-6 sm:py-8 md:flex-row md:gap-8 lg:gap-10">
        {/* LEFT SIDEBAR */}
        <div className="shrink-0 mb-6 md:mb-0 md:border-r md:border-border md:pr-8 md:w-52 lg:w-56">
          <div className="md:sticky md:top-8 flex flex-col gap-4">
            {/* Vertical tab nav */}
            <PageTabs
              groups={historyGroups}
              activeId={activeTab}
              onSelect={(id) => setActiveTab(id as TabType)}
              ariaLabel="History sections"
            />
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div role="region" aria-label="FEN History" className="min-w-0 flex-1">
          <HistoryFilters
            filters={activeFilters}
            onFiltersChange={activeFiltersChange}
            showStatus={activeTab === 'active'}
          />

          {currentData.length === 0 ? (
            <FENHistoryEmptyState activeTab={activeTab} />
          ) : (
            <FENHistoryGrid
              data={currentData}
              activeTab={activeTab}
              lightSquare={lightSquare}
              darkSquare={darkSquare}
              pieceStyle={pieceStyle}
              formatDate={formatDate}
              formatTime={formatTime}
              handleReactivate={handleReactivate}
              handleDelete={handleDelete}
              handleLoad={handleLoad}
              handleToggleFavorite={handleToggleFavorite}
            />
          )}
        </div>
      </div>

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
