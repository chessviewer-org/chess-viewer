import React, { memo } from 'react';

import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  Inbox,
  Star,
  Trash2
} from '@/assets/icons';

import { MiniPreview } from '@/components/board';
import { StatusBadge } from '@/components/features/History';
import { useCopyToClipboard } from '@/shared/hooks';

import { TabType } from '../hooks/useFENHistoryPage';

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

interface FENHistoryGridItemProps {
  entry: FENHistoryEntry;
  index: number;
  activeTab: TabType;
  lightSquare: string;
  darkSquare: string;
  pieceImages: Record<string, HTMLImageElement>;
  piecesLoading: boolean;
  formatDate: (ts: number) => string;
  formatTime: (ts: number) => string;
  handleReactivate: (id: number) => void;
  handleDelete: (id: number) => void;
  handleLoad: (fen: string) => void;
  handleToggleFavorite: (id: number) => void;
}

export const FENHistoryGridItem: React.FC<FENHistoryGridItemProps> = memo(
  ({
    entry,
    index,
    activeTab,
    lightSquare,
    darkSquare,
    pieceImages,
    piecesLoading,
    formatDate,
    formatTime,
    handleReactivate,
    handleDelete,
    handleLoad,
    handleToggleFavorite
  }) => {
    const timestamp = entry.createdAt ?? entry.timestamp ?? entry.archivedAt;
    const [copied, copyFen] = useCopyToClipboard();
    const handleCopy = () => copyFen(entry.fen);

    return (
      <div
        className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-lg hover:shadow-accent/5 hover:border-border transition-[box-shadow,border-color] duration-200 group flex flex-col min-h-50 animate-cardReveal"
        style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
      >
        <div className="w-full shrink-0 border-b border-border/30 overflow-hidden">
          <MiniPreview
            fen={entry.fen}
            lightSquare={lightSquare}
            darkSquare={darkSquare}
            pieceImages={pieceImages}
            piecesLoading={piecesLoading}
            size={400}
          />
        </div>

        <div className="p-3 flex flex-col flex-1 min-h-0">
          <div className="flex items-center gap-1.5 mb-2 min-w-0">
            <code className="font-mono text-[11px] leading-none text-text-secondary truncate flex-1 min-w-0">
              {entry.fen}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              title={copied ? 'Copied' : 'Copy FEN'}
              aria-label="Copy FEN to clipboard"
            >
              {copied ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>

          {activeTab === 'active' && entry.lastActiveAt !== undefined && (
            <div className="mb-2">
              <StatusBadge lastActiveAt={entry.lastActiveAt} />
            </div>
          )}

          <div className="flex-1" />

          <div className="flex flex-col gap-2">
            {timestamp !== undefined && (
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-text-muted font-medium">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays
                    className="w-3 h-3 shrink-0 text-text-muted/70"
                    aria-hidden="true"
                  />
                  {formatDate(timestamp)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock
                    className="w-3 h-3 shrink-0 text-text-muted/70"
                    aria-hidden="true"
                  />
                  {formatTime(timestamp)}
                </span>
              </div>
            )}

            {activeTab === 'archive' ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleReactivate(entry.id)}
                  className="flex-1 px-2.5 py-2 bg-accent hover:bg-accent-hover text-bg text-xs font-semibold rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
                >
                  Reactivate
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 hover:bg-error/10 text-text-muted hover:text-error rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-1 focus-visible:outline-none"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoad(entry.fen)}
                  className="flex-1 px-2.5 py-2 bg-accent hover:bg-accent-hover text-bg text-xs font-semibold rounded-lg transition-colors duration-200 shadow-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
                >
                  Load
                </button>
                <button
                  type="button"
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
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="p-2 hover:bg-surface-hover text-text-muted hover:text-text-secondary rounded-lg transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:outline-none"
                  aria-label="Archive"
                >
                  <Inbox className="w-3.5 h-3.5" aria-hidden="true" />
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
