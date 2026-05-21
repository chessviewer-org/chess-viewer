import React, { memo } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export interface PlaybackControlsProps {
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
 * PlaybackControls renders the active position slider bar.
 * Designed as a modern, floating capsule card to offer snappier transitions.
 *
 * @param props - Component configuration properties
 * @returns Clean, floating playback capsule component
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
          onClick={onTogglePlay}
          className="p-2 bg-accent hover:bg-accent-hover text-bg rounded-lg transition duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
        </button>
        <div className="relative">
          <button
            onClick={onToggleIntervalMenu}
            className="px-2.5 py-1.5 bg-surface hover:bg-surface-hover text-text-primary rounded-lg text-xs font-semibold transition duration-200 border border-border/60 min-w-12 text-center active:scale-[0.98]"
          >
            {interval}s
          </button>
          {showIntervalMenu && (
            <div className="absolute bottom-full mb-1.5 bg-surface-elevated border border-border rounded-lg shadow-lg overflow-hidden z-20 min-w-16">
              {intervalOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onSetInterval(opt)}
                  className={`w-full px-3 py-1.5 text-left text-xs transition duration-200 ${
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
          onClick={onPrevious}
          disabled={totalCount <= 1}
          className="p-1.5 bg-surface hover:bg-surface-hover rounded-lg transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-border/60 active:scale-[0.98] flex items-center justify-center"
          aria-label="Previous"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="px-2.5 py-1 bg-surface rounded-lg text-xs font-mono border border-border/60 min-w-12 text-center text-text-secondary">
          {currentIndex + 1} / {totalCount}
        </span>
        <button
          onClick={onNext}
          disabled={totalCount <= 1}
          className="p-1.5 bg-surface hover:bg-surface-hover rounded-lg transition duration-200 disabled:opacity-30 disabled:cursor-not-allowed border border-border/60 active:scale-[0.98] flex items-center justify-center"
          aria-label="Next"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';
export default PlaybackControls;
