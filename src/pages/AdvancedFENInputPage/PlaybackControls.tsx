import { memo } from 'react';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

/**
 * @param {Object} props
 * @returns {JSX.Element}
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
}) {
  return (
    <div className="mt-6 w-full max-w-[520px] flex items-center justify-between bg-surface border border-border rounded-2xl p-2 text-center">
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlay}
          className="p-2 bg-warning hover:bg-warning/90 text-bg rounded-lg transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        <div className="relative">
          <button
            onClick={onToggleIntervalMenu}
            className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-hover text-text-primary rounded-lg text-sm font-semibold transition-colors border border-border min-w-[52px] text-center"
          >
            {interval}s
          </button>
          {showIntervalMenu && (
            <div className="absolute top-full mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20 min-w-[72px]">
              {intervalOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onSetInterval(opt)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${opt === interval ? 'bg-warning/15 text-warning font-semibold' : 'hover:bg-surface-hover text-text-primary'}`}
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
          className="p-1.5 bg-surface-elevated hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-border"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 bg-surface-elevated rounded-lg text-sm font-mono border border-border min-w-[56px] text-center text-text-secondary">
          {currentIndex + 1} / {totalCount}
        </span>
        <button
          onClick={onNext}
          disabled={totalCount <= 1}
          className="p-1.5 bg-surface-elevated hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-border"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});
PlaybackControls.displayName = 'PlaybackControls';
export default PlaybackControls;
