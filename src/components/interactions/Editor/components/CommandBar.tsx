import { memo } from 'react';

import { Copy, Download, Redo2, Repeat2, Share2, Undo2 } from '@/assets/icons';

interface CommandBarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFlip?: () => void;
  onCopyImage: () => void;
  onShare: () => void;
  onDownload?: (() => void) | undefined;
}

const iconButton =
  'p-1.5 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const Divider = () => (
  <span className="self-stretch w-px bg-white/20 mx-1" aria-hidden="true" />
);

export const CommandBar = memo(function CommandBar({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onFlip,
  onCopyImage,
  onShare,
  onDownload
}: CommandBarProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`${iconButton} text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Undo (Ctrl+Z)"
          aria-label="Undo last change"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`${iconButton} text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Redo (Ctrl+Y)"
          aria-label="Redo last change"
        >
          <Redo2 className="w-5 h-5" />
        </button>

        <Divider />

        <button
          type="button"
          onClick={onFlip}
          className={`${iconButton} text-text-secondary hover:text-text-primary hover:bg-surface-hover`}
          title="Flip board (F)"
          aria-label="Flip board orientation"
        >
          <Repeat2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onCopyImage}
          className={`${iconButton} text-text-secondary hover:text-text-primary hover:bg-surface-hover`}
          title="Copy image"
          aria-label="Copy board image to clipboard"
        >
          <Copy className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onShare}
          className={`${iconButton} text-text-secondary hover:text-text-primary hover:bg-surface-hover`}
          title="Share"
          aria-label="Share board"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <Divider />

        <button
          type="button"
          onClick={onDownload}
          className={`${iconButton} text-accent hover:text-text-primary hover:bg-accent/10`}
          title="Download / Export"
          aria-label="Download or export board"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

CommandBar.displayName = 'CommandBar';
