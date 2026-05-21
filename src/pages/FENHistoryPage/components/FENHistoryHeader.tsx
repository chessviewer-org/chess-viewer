import React, { memo } from 'react';
import { Archive as ArchiveIcon, ArrowLeft, Clock, Star } from 'lucide-react';
import { TabType } from '../hooks/useFENHistoryPage';

interface FENHistoryHeaderProps {
  currentDataLength: number;
  fenHistoryLength: number;
  favoritesDataLength: number;
  archiveLength: number;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  handleBack: () => void;
  handleClearAll: () => Promise<void>;
}

export const FENHistoryHeader: React.FC<FENHistoryHeaderProps> = memo(({
  currentDataLength,
  fenHistoryLength,
  favoritesDataLength,
  archiveLength,
  activeTab,
  setActiveTab,
  handleBack,
  handleClearAll
}) => {
  return (
    <header className="shrink-0 bg-surface border-b border-border animate-pageEnter">
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
              {currentDataLength}
            </span>
          </div>

          {currentDataLength > 0 && (
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
              Active ({fenHistoryLength})
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
              Favorites ({favoritesDataLength})
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
              Archive ({archiveLength})
            </span>
          </button>
        </div>
      </div>
    </header>
  );
});

FENHistoryHeader.displayName = 'FENHistoryHeader';
