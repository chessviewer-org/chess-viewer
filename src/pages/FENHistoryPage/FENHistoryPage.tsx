import React, { memo, useMemo, useRef } from 'react';

import { Clock, Inbox, Star } from '@/assets/icons';

import {
  ConfirmationModal,
  HistoryFilters
} from '@/components/features/History';
import {
  type PageTabGroup,
  PageSidebarLayout,
  PageTabs
} from '@/components/layout';
import { getRouteSeo, SOFTWARE_APP_SCHEMA } from '@constants';

import { Seo } from '@shared/ui';
import { FENHistoryEmptyState } from './components/FENHistoryEmptyState';
import { FENHistoryGrid } from './components/FENHistoryGrid';
import { type TabType, useFENHistoryPage } from './hooks/useFENHistoryPage';

const getHistoryGroups = (
  activeCount: number,
  favoritesCount: number,
  archiveCount: number
): PageTabGroup[] => [
  {
    items: [
      {
        id: 'active',
        label: `Active (${activeCount})`,
        icon: Clock
      },
      {
        id: 'favorites',
        label: `Favorites (${favoritesCount})`,
        icon: Star
      },
      {
        id: 'archive',
        label: `Archive (${archiveCount})`,
        icon: Inbox
      }
    ]
  }
];

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

  const historyGroups = useMemo(
    () =>
      getHistoryGroups(fenHistory.length, favoritesData.length, archive.length),
    [fenHistory.length, favoritesData.length, archive.length]
  );

  const contentRef = useRef<HTMLDivElement>(null);

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
    <div className="min-h-full bg-bg lg:h-full lg:max-h-full">
      <Seo {...getRouteSeo('/fen-history')} schema={SOFTWARE_APP_SCHEMA} />

      <PageSidebarLayout
        contentRef={contentRef}
        contentLabel="FEN History"
        sidebar={
          <PageTabs
            groups={historyGroups}
            activeId={activeTab}
            onSelect={(id) => setActiveTab(id as TabType)}
            ariaLabel="History sections"
          />
        }
      >
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
      </PageSidebarLayout>

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
