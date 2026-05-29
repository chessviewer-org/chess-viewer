import React, { memo } from 'react';

import { Clock } from 'lucide-react';

import { TabType } from '../hooks/useFENHistoryPage';

/** Props for the empty state shown when the active history tab has no entries. */
interface FENHistoryEmptyStateProps {
  activeTab: TabType;
}

/** Displays a contextual empty-state message depending on which history tab is active. */
export const FENHistoryEmptyState: React.FC<FENHistoryEmptyStateProps> = memo(({ activeTab }) => {
  return (
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
  );
});

FENHistoryEmptyState.displayName = 'FENHistoryEmptyState';
