import { memo } from 'react';

import { BaseHistoryEntry } from '@app-types/history';

import { TabType } from '../hooks/useFENHistoryPage';
import { FENHistoryGridItem } from './FENHistoryGridItem';

/** Props for the responsive FEN history grid. */
interface FENHistoryGridProps {
  data: BaseHistoryEntry[];
  activeTab: TabType;
  lightSquare: string;
  darkSquare: string;
  pieceStyle: string;
  formatDate: (ts: number) => string;
  formatTime: (ts: number) => string;
  handleReactivate: (id: number) => void;
  handleDelete: (id: number) => void;
  handleLoad: (fen: string) => void;
  handleToggleFavorite: (id: number) => void;
}

/**
 * Responsive grid of FEN history cards. Rendered as a plain CSS grid that flows
 * inside the page's own scroll region (the parent `<main>` owns the scrollbar) —
 * deliberately NOT a virtualized inner-scroll list, so the page scrolls as one
 * surface below the header + filters.
 */
export const FENHistoryGrid = memo(function FENHistoryGrid({
  data,
  activeTab,
  lightSquare,
  darkSquare,
  pieceStyle,
  formatDate,
  formatTime,
  handleReactivate,
  handleDelete,
  handleLoad,
  handleToggleFavorite
}: FENHistoryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {data.map((entry, index) => (
        <FENHistoryGridItem
          key={entry.id}
          entry={entry}
          index={index}
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
      ))}
    </div>
  );
});
