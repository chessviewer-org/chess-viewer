import React, { memo } from 'react';

import { ChevronLeft, ChevronRight, Pause, Play } from '@/assets/icons';

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
    <div className="w-full flex items-center justify-between bg-surface-elevated/80 backdrop-blur-md border border-border/40 rounded-full px-2 py-1.5 text-center select-none shadow-sm">
      <div className="flex items-center justify-center min-w-16 pl-3">
        <span className="text-xs font-semibold text-text-secondary tabular-nums">
          {currentIndex + 1} <span className="opacity-50 mx-0.5">/</span>{' '}
          {totalCount}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrevious}
          disabled={totalCount <= 1}
          className="p-1.5 text-text-secondary hover:text-text-primary rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className="p-2.5 bg-accent hover:bg-accent-hover text-bg rounded-full transition-transform active:scale-[0.92] shadow-md flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" aria-hidden="true" strokeWidth={3} />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={totalCount <= 1}
          className="p-1.5 text-text-secondary hover:text-text-primary rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex items-center justify-center min-w-16 pr-2">
        <button
          type="button"
          onClick={onToggleIntervalMenu}
          aria-haspopup="menu"
          aria-expanded={showIntervalMenu}
          aria-label={`Playback interval: ${interval} seconds`}
          className="px-2.5 py-1 text-text-secondary hover:text-text-primary hover:bg-surface rounded-full text-xs font-semibold transition-colors border border-transparent hover:border-border/40 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {interval}s
        </button>
        {showIntervalMenu && (
          <div
            role="menu"
            className="absolute bottom-full right-0 mb-2 bg-surface-elevated/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl overflow-hidden z-20 min-w-16 p-1 origin-bottom-right animate-fadeIn"
          >
            {intervalOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                role="menuitemradio"
                aria-checked={opt === interval}
                onClick={() => onSetInterval(opt)}
                className={`w-full px-3 py-1.5 text-center rounded-lg text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  opt === interval
                    ? 'bg-accent text-bg font-bold shadow-sm'
                    : 'hover:bg-surface-hover text-text-secondary font-medium'
                }`}
              >
                {opt}s
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';
export default PlaybackControls;
