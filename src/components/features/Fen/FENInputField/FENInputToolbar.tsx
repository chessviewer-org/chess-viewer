import { memo } from 'react';

import { Clipboard, Eraser, Plus, RotateCcw, Star } from 'lucide-react';

/** Props for the `FENInputToolbar` action button row. */
interface FENInputToolbarProps {
  isFavorite: boolean;
  onPaste?: (() => void) | undefined;
  onAddToBatch: () => void;
  onToggleFavorite: () => void;
  /** Load the standard starting position. */
  onStartPosition: () => void;
  /** Clear the board to an empty position. */
  onClearBoard: () => void;
}

const buttonBase =
  'flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md transition duration-150 ease-out active:scale-95 hover:bg-opacity-80 text-[11px] sm:text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent h-6 sm:h-7';

const neutralButton =
  'bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-text-primary';

/** A high-contrast vertical divider between toolbar button groups. */
const GroupDivider = () => (
  <span
    className="self-stretch w-px bg-white/20 my-0.5 shrink-0"
    aria-hidden="true"
  />
);

const FENInputToolbar = memo(function FENInputToolbar({
  isFavorite,
  onPaste,
  onAddToBatch,
  onToggleFavorite,
  onStartPosition,
  onClearBoard
}: FENInputToolbarProps) {
  return (
    // Tight inner gaps within a group; visible dividers BETWEEN groups.
    <div className="flex flex-nowrap sm:flex-wrap items-center justify-start gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-0.5 bg-surface-elevated border-b border-border overflow-x-auto hide-scrollbar">
      {/* Group 1 — Paste */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPaste}
          className={`${buttonBase} ${neutralButton}`}
          title="Paste FEN from clipboard"
          aria-label="Paste FEN from clipboard"
          type="button"
        >
          <Clipboard
            className="w-3.5 h-3.5"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span className="sr-only">Paste</span>
        </button>
      </div>

      <GroupDivider />

      {/* Group 2 — Add · Save */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAddToBatch}
          className={`${buttonBase} ${neutralButton}`}
          title="Add to batch (no redirect)"
          aria-label="Add to batch"
          type="button"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
          <span>Add</span>
        </button>

        <button
          onClick={onToggleFavorite}
          className={`${buttonBase} ${
            isFavorite
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-text-primary'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          type="button"
        >
          <Star
            className={`w-3.5 h-3.5 transition duration-200 ease-out ${
              isFavorite ? 'scale-110' : 'scale-100'
            }`}
            strokeWidth={2.5}
            fill={isFavorite ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">
            {isFavorite ? 'Saved' : 'Save'}
          </span>
        </button>
      </div>

      <GroupDivider />

      {/* Group 3 — Start · Clear (relocated from the board's bottom action bar;
          each just loads a canonical FEN and the board syncs from it). */}
      <div className="flex items-center gap-1">
        <button
          onClick={onStartPosition}
          className={`${buttonBase} ${neutralButton}`}
          title="Load the starting position"
          aria-label="Load starting position"
          type="button"
        >
          <RotateCcw
            className="w-3.5 h-3.5"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span>Reset</span>
        </button>

        <button
          onClick={onClearBoard}
          className={`${buttonBase} bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-error hover:border-error/40`}
          title="Clear the board (empty position)"
          aria-label="Clear board"
          type="button"
        >
          <Eraser
            className="w-3.5 h-3.5"
            strokeWidth={2.5}
            aria-hidden="true"
          />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
});

export default FENInputToolbar;
