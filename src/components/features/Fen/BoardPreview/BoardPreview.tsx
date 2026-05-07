import { memo } from 'react';

import { ChevronLeft, ChevronRight, Pause, Play, Star } from 'lucide-react';

export interface BoardPreviewProps {
  validFens: string[];
  currentIndex: number;
  currentFen: string;
  boardState: string[][];
  currentTheme: { light: string; dark: string };
  pieceImages: Record<string, HTMLImageElement | null>;
  imagesLoading: boolean;
  favorites: Record<string, boolean>;
  isPlaying: boolean;
  interval: number;
  intervalOptions: { label: string; value: number }[];
  showIntervalMenu: boolean;
  onSetInterval: (value: number) => void;
  onToggleIntervalMenu: () => void;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSetIndex: (index: number) => void;
}

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const BoardPreview = memo(function BoardPreview({
  validFens,
  currentIndex,
  currentFen,
  boardState,
  currentTheme,
  pieceImages,
  imagesLoading,
  favorites,
  isPlaying,
  interval,
  intervalOptions,
  showIntervalMenu,
  onSetInterval,
  onToggleIntervalMenu,
  onTogglePlay,
  onPrevious,
  onNext,
  onSetIndex
}: BoardPreviewProps) {
  if (validFens.length === 0) {
    return null;
  }
  return (
    <div className="bg-surface border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">
          Live Preview
        </h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={onToggleIntervalMenu}
              className="flex items-center gap-2 bg-surface-elevated rounded-lg px-3 py-2 border border-border hover:bg-surface-hover transition-colors"
              aria-label="Select slideshow interval"
              aria-expanded={showIntervalMenu}
            >
              <span className="text-xs text-text-muted">Interval:</span>
              <span className="text-sm font-semibold text-text-primary">
                {interval}s
              </span>
            </button>
            {showIntervalMenu && (
              <div
                className="absolute top-full right-0 mt-2 bg-surface border border-border rounded-lg shadow-xl z-10 overflow-hidden min-w-[100px]"
                role="menu"
              >
                {intervalOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onSetInterval(option.value)}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${interval === option.value ? 'bg-accent text-bg font-semibold' : 'text-text-secondary hover:bg-surface-hover'}`}
                    role="menuitem"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onTogglePlay}
            disabled={validFens.length < 2}
            className="p-2 bg-accent hover:bg-accent-hover disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label={isPlaying ? 'Pause slideshow' : 'Start slideshow'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      <div className="relative bg-surface-elevated rounded-lg border border-border p-6">
        <div className="text-center mb-4">
          <div className="inline-block bg-surface px-4 py-2 rounded-lg border border-border">
            <span className="text-sm text-text-muted">Position </span>
            <span className="text-lg font-bold text-text-primary">
              {currentIndex + 1}
            </span>
            <span className="text-sm text-text-muted">
              {' '}
              of {validFens.length}
            </span>
          </div>
        </div>

        <div
          className="mx-auto aspect-square max-w-lg"
          role="img"
          aria-label={`Chess board showing position ${currentIndex + 1}`}
        >
          <div className="grid grid-cols-8 gap-0 overflow-hidden shadow-2xl rounded-lg">
            {Array.from({
              length: 64
            }).map((_, i) => {
              const row = Math.floor(i / 8);
              const col = i % 8;
              const isLight = (row + col) % 2 === 0;
              const piece = boardState[row]?.[col] || '';
              return (
                <div
                  key={`sq-${row}-${col}`}
                  className="aspect-square flex items-center justify-center relative"
                  style={{
                    backgroundColor: isLight
                      ? currentTheme.light
                      : currentTheme.dark,
                    outline: '1px solid transparent'
                  }}
                >
                  {piece && pieceImages[piece] && !imagesLoading && (
                    <img
                      src={pieceImages[piece].src}
                      alt={piece}
                      className="w-[85%] h-[85%] object-contain"
                      draggable="false"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-border">
            {favorites[currentFen] && (
              <Star className="w-4 h-4 text-warning" fill="currentColor" />
            )}
            <p className="text-xs font-mono text-text-muted break-all max-w-xl">
              {currentFen}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={onPrevious}
            disabled={validFens.length < 2}
            className="p-3 bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label="Previous position"
          >
            <ChevronLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div className="flex gap-2" role="tablist">
            {validFens.map((fenVal, idx) => (
              <button
                key={fenVal}
                onClick={() => onSetIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${idx === currentIndex ? 'bg-accent w-8' : 'bg-border hover:bg-border-subtle w-2.5'}`}
                aria-label={`Go to position ${idx + 1}`}
                aria-selected={idx === currentIndex}
                role="tab"
              />
            ))}
          </div>
          <button
            onClick={onNext}
            disabled={validFens.length < 2}
            className="p-3 bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            aria-label="Next position"
          >
            <ChevronRight className="w-5 h-5 text-text-primary" />
          </button>
        </div>
      </div>
    </div>
  );
});
BoardPreview.displayName = 'BoardPreview';
export default BoardPreview;
