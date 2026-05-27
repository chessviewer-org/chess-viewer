import { memo } from 'react';
import {
  CheckCircle,
  Clipboard,
  Copy,
  Heart,
  List,
  Plus
} from 'lucide-react';

/** Props for the `FENInputToolbar` action button row. */
interface FENInputToolbarProps {
  copySuccess?: boolean | undefined;
  isFavorite: boolean;
  onOpenClipboard: () => void;
  onPaste?: (() => void) | undefined;
  onCopy: () => void;
  onAddToBatch: () => void;
  onToggleFavorite: () => void;
}

const buttonBase =
  'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition duration-150 ease-out active:scale-95 hover:bg-opacity-80 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-9 sm:min-h-10';

const neutralButton =
  'bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-accent';

const FENInputToolbar = memo(function FENInputToolbar({
  copySuccess,
  isFavorite,
  onOpenClipboard,
  onPaste,
  onCopy,
  onAddToBatch,
  onToggleFavorite
}: FENInputToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-surface-elevated border-b border-border">
      <button
        onClick={onOpenClipboard}
        className={`p-1.5 sm:p-2 rounded-md transition duration-150 ease-out active:scale-95 hover:bg-opacity-80 ${neutralButton} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-9 sm:min-h-10`}
        title="View clipboard history"
        aria-label="View clipboard history"
        type="button"
      >
        <List className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
      </button>

      <button
        onClick={onPaste}
        className={`${buttonBase} ${neutralButton}`}
        title="Paste FEN from clipboard"
        aria-label="Paste FEN from clipboard"
        type="button"
      >
        <Clipboard className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
        <span className="hidden sm:inline">Paste</span>
      </button>

      <button
        onClick={onCopy}
        className={`${buttonBase} ${
          copySuccess
            ? 'bg-success/20 text-success border border-success/30'
            : neutralButton
        }`}
        title={copySuccess ? 'Copied!' : 'Copy FEN to clipboard'}
        aria-label={
          copySuccess ? 'FEN copied to clipboard' : 'Copy FEN to clipboard'
        }
        type="button"
      >
        {copySuccess ? (
          <>
            <CheckCircle
              className="w-3.5 h-3.5 animate-in zoom-in-50 duration-200 ease-out"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <span className="hidden sm:inline animate-in fade-in duration-200 ease-out">
              Copied
            </span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden sm:inline">Copy</span>
          </>
        )}
      </button>

      <button
        onClick={onAddToBatch}
        className={`${buttonBase} ${neutralButton}`}
        title="Add to batch (no redirect)"
        aria-label="Add to batch"
        type="button"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
        <span className="hidden sm:inline">Add</span>
      </button>

      <button
        onClick={onToggleFavorite}
        className={`${buttonBase} ${
          isFavorite
            ? 'bg-error/20 text-error border border-error/30'
            : 'bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-error'
        }`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        type="button"
      >
        <Heart
          className={`w-3.5 h-3.5 transition duration-200 ease-out ${
            isFavorite ? 'scale-110' : 'scale-100'
          }`}
          strokeWidth={2.5}
          fill={isFavorite ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
      </button>
    </div>
  );
});

export default FENInputToolbar;
