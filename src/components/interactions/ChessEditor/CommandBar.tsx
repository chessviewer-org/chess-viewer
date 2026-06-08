import { memo } from 'react';

import { Copy, Download, Share2 } from 'lucide-react';

/**
 * ChessVision Command Bar.
 *
 * A compact header row for the board's primary actions: Copy · Share |
 * Open · Export. Database search now lives in its own dedicated
 * DatabaseSearchPanel, so this bar no longer carries search status or DB icons.
 *
 * Every colour resolves through the existing Tailwind CSS-variable tokens
 * (`text-accent`, `text-text-secondary`, …) — no hard-coded hex.
 */
export interface CommandBarProps {
  onCopyFen: () => void;
  onShare: () => void;
  onDownload?: (() => void) | undefined;
}

/** Shared icon-button shell — consistent hit-area, focus ring, transitions. */
const iconButton =
  'p-1.5 rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const Divider = () => (
  <span className="self-stretch w-px bg-white/20 mx-1" aria-hidden="true" />
);

const CommandBar = memo(function CommandBar({
  onCopyFen,
  onShare,
  onDownload
}: CommandBarProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onCopyFen}
        className={`${iconButton} text-text-secondary hover:text-text-primary hover:bg-surface-hover`}
        title="Copy FEN"
        aria-label="Copy FEN to clipboard"
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

      {/* Placeholder for a future "open / import" flow — wired up later, so it
          is disabled and excluded from the tab order for now. */}
      <button
        type="button"
        disabled
        className={`${iconButton} text-text-muted opacity-50 cursor-not-allowed`}
        title="Open (coming soon)"
        aria-label="Open a board (coming soon)"
        tabIndex={-1}
      >
        <FolderOpen className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onDownload}
        className={`${iconButton} text-accent hover:text-accent-hover hover:bg-accent/10`}
        title="Download / Export"
        aria-label="Download or export board"
      >
        <Download className="w-5 h-5" />
      </button>
    </div>
  );
});

CommandBar.displayName = 'CommandBar';

export default CommandBar;
