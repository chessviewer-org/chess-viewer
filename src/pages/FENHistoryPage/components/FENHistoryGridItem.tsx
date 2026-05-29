import React, { memo } from 'react';

import { Archive as ArchiveIcon, Clock, Star, Trash2 } from 'lucide-react';

import { MiniPreview } from '@/components/board';
import { StatusBadge } from '@/components/features/History';

import { TabType } from '../hooks/useFENHistoryPage';

/** Shape of a single FEN history record rendered by this component. */
interface FENHistoryEntry {
  id: number;
  fen: string;
  isFavorite: boolean;
  lastActiveAt?: number;
  createdAt?: number;
  timestamp?: number;
  archivedAt?: number;
  source?: string;
}

/** Props for the individual board-preview card in the history grid. */
interface FENHistoryGridItemProps {
  entry: FENHistoryEntry;
  index: number;
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

/** Board-preview card with load, favorite, archive/delete actions for a single FEN entry. */
export const FENHistoryGridItem: React.FC<FENHistoryGridItemProps> = memo(
  ({
    entry,
    index,
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
  }) => {
    return (
      <div
        className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-accent/5 hover:border-accent/30 transition-[box-shadow,border-color] duration-200 group flex flex-col min-h-50 animate-cardReveal"
        style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
      >
        <div className="aspect-square bg-bg p-2 shrink-0 border-b border-border/30">
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
          <div className="font-mono text-xs text-text-muted/70 truncate mb-2">
            {entry.fen.split(' ')[0]}
          </div>

          {activeTab === 'active' && entry.lastActiveAt && (
            <div className="mb-2">
              <StatusBadge lastActiveAt={entry.lastActiveAt} />
            </div>
          )}

          <div className="flex-1"></div>

          <div className="flex flex-col gap-2">
            {(entry.createdAt || entry.timestamp || entry.archivedAt) && (
              <div className="text-xs text-text-muted/60 flex items-center gap-1 font-medium">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 opacity-50" />
                <span>
                  {formatDate(
                    (entry.createdAt || entry.timestamp || entry.archivedAt)!
                  )}
                </span>
                <span className="opacity-40">•</span>
                <span>
                  {formatTime(
                    (entry.createdAt || entry.timestamp || entry.archivedAt)!
                  )}
                </span>
              </div>
            )}

            {activeTab === 'archive' ? (
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleReactivate(entry.id)}
                  className="flex-1 px-2.5 py-2 bg-accent hover:bg-accent-hover text-bg text-xs font-semibold rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
                >
                  Reactivate
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 hover:bg-error/10 text-text-muted hover:text-error rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-1 focus-visible:outline-none"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleLoad(entry.fen)}
                  className="flex-1 px-2.5 py-2 bg-accent hover:bg-accent-hover text-bg text-xs font-semibold rounded-lg transition-colors duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
                >
                  Load
                </button>
                <button
                  onClick={() => handleToggleFavorite(entry.id)}
                  className={`p-2 rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none ${
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
                  className="p-2 hover:bg-surface-hover text-text-muted hover:text-text-secondary rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
                  aria-label="Archive"
                >
                  <ArchiveIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

FENHistoryGridItem.displayName = 'FENHistoryGridItem';
