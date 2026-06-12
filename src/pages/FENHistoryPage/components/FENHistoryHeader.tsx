import React, { memo } from 'react';

import { ArrowLeft, Clock, Inbox, Star, Trash2 } from 'lucide-react';

import { TabType } from '../hooks/useFENHistoryPage';

/** Props for the FEN history page header with tab counts and clear-all action. */
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

/** Sticky header with back button, active/favorites/archive tab switcher, and entry count badge. */
export const FENHistoryHeader: React.FC<FENHistoryHeaderProps> = memo(
  ({
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
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-accent group-hover:text-text-primary-hover transition-colors duration-200" />
                <span className="text-xs sm:text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-200">
                  Back
                </span>
              </button>
              <div className="h-6 sm:h-8 w-px bg-border/50 hidden sm:block" />
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-text-secondary animate-iconBounceIn" />
                <h1 className="text-lg sm:text-2xl font-display font-bold text-text-primary animate-fadeIn">
                  FEN History
                </h1>
              </div>
            </div>

            {currentDataLength > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-error hover:bg-error/10 rounded-xl transition-colors duration-200"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab nav in the AdvancedFENInput wizard style (soft accent-tint on the
            active tab, no track box, no divider bars) — but stretched the full
            screen width so each tab takes ~1/3 (flex-1). */}
        <div className="px-4 sm:px-6 pb-2 sm:pb-2.5">
          <div className="flex items-center gap-2 border-t border-border/40 pt-2 sm:pt-2.5">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors duration-150 ${
                activeTab === 'active'
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Active ({fenHistoryLength})</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors duration-150 ${
                activeTab === 'favorites'
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">
                Favorites ({favoritesDataLength})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors duration-150 ${
                activeTab === 'archive'
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">Archive ({archiveLength})</span>
            </button>
          </div>
        </div>
      </header>
    );
  }
);

FENHistoryHeader.displayName = 'FENHistoryHeader';
