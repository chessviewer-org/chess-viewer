import React, { memo } from 'react';

import { ConfirmationModal, HistoryFilters } from '@/components/panels/History';

import { FENHistoryEmptyState } from './components/FENHistoryEmptyState';
import { FENHistoryGrid } from './components/FENHistoryGrid';
import { FENHistoryHeader } from './components/FENHistoryHeader';
import { useFENHistoryPage } from './hooks/useFENHistoryPage';

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
  } = useFENHistoryPage();

  return (
    <div className="h-full max-h-full flex flex-col bg-bg overflow-hidden">
      <FENHistoryHeader
        currentDataLength={currentData.length}
        fenHistoryLength={fenHistory.length}
        favoritesDataLength={favoritesData.length}
        archiveLength={archive.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleBack={handleBack}
        handleClearAll={handleClearAll}
      />

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

      {/* Single page-internal scroll region BELOW the sticky header + filters.
          The board cards scroll here; there is no separate inner scrollbar. */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
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
