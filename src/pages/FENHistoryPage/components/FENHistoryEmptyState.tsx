import React, { memo } from 'react';

import { Clock } from '@/assets/icons';

import { TabType } from '../hooks/useFENHistoryPage';

interface FENHistoryEmptyStateProps {
  activeTab: TabType;
}

export const FENHistoryEmptyState: React.FC<FENHistoryEmptyStateProps> = memo(
  ({ activeTab }) => {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 animate-fadeIn">
        <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-text-muted/60 mb-3" />
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
  }
);

FENHistoryEmptyState.displayName = 'FENHistoryEmptyState';
