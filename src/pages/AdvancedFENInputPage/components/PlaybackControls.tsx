import React, { memo } from 'react';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

/** Props for the batch position playback control bar. */
interface PlaybackControlsProps {
  isPlaying: boolean;
  interval: number;
  showIntervalMenu: boolean;
  intervalOptions: number[];
  currentIndex: number;
  totalCount: number;
  onTogglePlay: () => void;
  onSetInterval: (interval: number) => void;
  onToggleIntervalMenu: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * Floating capsule bar for play/pause, interval selection, and prev/next navigation through batch positions.
 */
const PlaybackControls = memo(function PlaybackControls({
  isPlaying,
  interval,
  showIntervalMenu,
  intervalOptions,
  currentIndex,
  totalCount,
  onTogglePlay,
  onSetInterval,
  onToggleIntervalMenu,
  onPrevious,
  onNext
}: PlaybackControlsProps): React.JSX.Element {
  return (
    <div className="w-full flex items-center justify-between bg-surface-elevated border border-border/60 rounded-xl px-4 py-2 text-center select-none">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="p-2 bg-accent hover:bg-accent-hover text-bg rounded-lg transition duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface-elevated"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
          )}
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleIntervalMenu}
            aria-haspopup="menu"
            aria-expanded={showIntervalMenu}
            aria-label={`Playback interval: ${interval} seconds`}
            className="px-2.5 py-1.5 bg-surface hover:bg-surface-hover text-text-primary rounded-lg text-xs font-semibold transition duration-200 border border-border/60 min-w-12 text-center active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {interval}s
          </button>
          {showIntervalMenu && (
            <div
              role="menu"
              className="absolute bottom-full mb-1.5 bg-surface-elevated border border-border rounded-lg shadow-lg overflow-hidden z-20 min-w-16"
            >
              {intervalOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="menuitemradio"
                  aria-checked={opt === interval}
                  onClick={() => onSetInterval(opt)}
                  className={`w-full px-3 py-1.5 text-left text-xs transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                    opt === interval
                      ? 'bg-accent/10 text-accent font-semibold'
                      : 'hover:bg-surface-hover text-text-primary'
                  }`}
                >
                  {opt}s
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrevious}
          disabled={totalCount <= 1}
          className="p-1.5 bg-surface hover:bg-surface-hover rounded-lg transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-border/60 active:scale-[0.98] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Previous"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <span className="px-2.5 py-1 bg-surface rounded-lg text-xs font-mono border border-border/60 min-w-12 text-center text-text-secondary">
          {currentIndex + 1} / {totalCount}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={totalCount <= 1}
          className="p-1.5 bg-surface hover:bg-surface-hover rounded-lg transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-border/60 active:scale-[0.98] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Next"
        >
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';
export default PlaybackControls;
