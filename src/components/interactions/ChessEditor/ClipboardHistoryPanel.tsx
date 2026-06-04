import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  SquarePen,
  Trash2
} from 'lucide-react';
import { List, RowComponentProps } from 'react-window';

import { useModal } from '@/contexts';

import { logger } from '@utils/logger';
import { safeJSONParse } from '@utils/validation';

type HistoryEntry = string | { fen: string; timestamp: number };

/** Zero-pad to 2 digits. */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Format a timestamp as strict "DD.MM.YYYY" + "HH:MM" (24h, local). */
function formatStamp(ts: number): { date: string; time: string } {
  const d = new Date(ts);
  return {
    date: `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  };
}

/** Row item data passed to the virtualized list renderer. */
interface RowData {
  items: HistoryEntry[];
  activeFen: string;
  onSelect: (fen: string) => void;
  onCopy: (fen: string, index: number) => void;
  onRemove: (index: number) => void;
  onSendToAdvanced: (fen: string) => void;
  copiedIndex: number | null;
}

const Row = ({
  index,
  style,
  items,
  activeFen,
  onSelect,
  onCopy,
  onRemove,
  onSendToAdvanced,
  copiedIndex
}: RowComponentProps<RowData>) => {
  const item = items[index];
  if (!item) return null;

  const fen = typeof item === 'string' ? item : item.fen || '';
  const timestamp = typeof item === 'string' ? undefined : item.timestamp;
  const stamp = timestamp ? formatStamp(timestamp) : null;
  // The entry currently loaded on the board — highlighted so the user can see
  // which item they are previewing as they click through the list.
  const isActive = fen.trim() === activeFen.trim();

  return (
    <div style={style} className="pr-1 pb-2">
      <div
        className={`rounded-lg p-3 transition-colors h-full flex flex-col justify-center border ${
          isActive
            ? 'border-accent/60 bg-accent/5'
            : 'border-border/50 bg-surface hover:border-accent/40'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs text-text-primary break-all mb-1.5 line-clamp-2">
              {fen}
            </div>
            {stamp && (
              <div className="flex items-center gap-3 text-[11px] text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Calendar
                    className="w-3 h-3 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {stamp.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock
                    className="w-3 h-3 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {stamp.time}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onSelect(fen)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-accent/20 text-accent border border-accent/40'
                  : 'bg-accent hover:bg-accent-hover text-bg'
              }`}
              title="Preview this FEN on the board"
            >
              {isActive ? 'Active' : 'Use'}
            </button>

            <button
              onClick={() => onSendToAdvanced(fen)}
              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-accent/10 hover:text-accent text-text-secondary transition-colors"
              title="Open in Advanced FEN editor"
              aria-label="Open in Advanced FEN editor"
            >
              <SquarePen className="w-4 h-4" />
            </button>

            <button
              onClick={() => onCopy(fen, index)}
              className={`p-1.5 rounded-lg transition-colors ${
                copiedIndex === index
                  ? 'bg-success/20 text-success'
                  : 'bg-surface-elevated hover:bg-surface-hover text-text-secondary'
              }`}
              title="Copy to clipboard"
            >
              {copiedIndex === index ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={() => onRemove(index)}
              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-error/10 hover:text-error text-text-secondary transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
Row.displayName = 'Row';

/** Props for the inline `ClipboardHistoryPanel`. */
export interface ClipboardHistoryPanelProps {
  /** Whether the panel is currently the active right-side view. */
  isActive: boolean;
  /** FEN currently on the board (for highlighting the active entry). */
  currentFen: string;
  /** Load a FEN onto the board — does NOT close the panel (live preview). */
  onSelectFen: (fen: string) => void;
  /** Open a FEN in the Advanced FEN editor (navigates away). */
  onSendToAdvanced: (fen: string) => void;
  /** Switch the right side back to the normal control tools. */
  onBack: () => void;
}

const STORAGE_KEY = 'fenClipboardHistory';
const ITEM_HEIGHT = 92;
// The list shows up to 5 items at full height; extra items scroll within a
// sleek thin scrollbar. (Each item's outer wrapper carries its own pb-2.)
const VISIBLE_ITEMS = 5;
const LIST_MAX_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

/**
 * Inline Clipboard History view that replaces the right-side controls (no
 * modal, no backdrop). Selecting an entry previews it on the board WITHOUT
 * leaving the panel, so the user can click through items and compare them
 * against the live board on the left.
 */
const ClipboardHistoryPanel = memo(function ClipboardHistoryPanel({
  isActive,
  currentFen,
  onSelectFen,
  onSendToAdvanced,
  onBack
}: ClipboardHistoryPanelProps) {
  const { showConfirm } = useModal();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    },
    []
  );

  const loadHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(safeJSONParse<HistoryEntry[]>(saved, []));
      else setHistory([]);
    } catch (err) {
      logger.error('Failed to load history:', err);
    }
  }, []);

  // Refresh whenever the panel becomes active (a newly-copied FEN should show).
  useEffect(() => {
    if (isActive) loadHistory();
  }, [isActive, loadHistory]);

  const handleCopy = useCallback((fen: string, index: number) => {
    void navigator.clipboard.writeText(fen);
    setCopiedIndex(index);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setHistory((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleClearAll = useCallback(async () => {
    const confirmed = await showConfirm(
      'Clear History',
      'Clear all clipboard history? This cannot be undone.',
      'danger'
    );
    if (confirmed) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [showConfirm]);

  const itemData = useMemo<RowData>(
    () => ({
      items: history,
      activeFen: currentFen,
      onSelect: onSelectFen,
      onCopy: handleCopy,
      onRemove: handleRemove,
      onSendToAdvanced,
      copiedIndex
    }),
    [
      history,
      currentFen,
      onSelectFen,
      handleCopy,
      handleRemove,
      onSendToAdvanced,
      copiedIndex
    ]
  );

  // The virtualized list is exactly as tall as its content, capped at 5 items —
  // beyond that it scrolls within the sleek thin scrollbar.
  const listHeight = Math.min(history.length * ITEM_HEIGHT, LIST_MAX_HEIGHT);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header — title + Back to Tools (no modal chrome). */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-white/15">
        <h2 className="text-sm font-bold text-text-primary">
          Clipboard History
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-text-secondary hover:text-accent hover:bg-surface-hover border border-border/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          title="Back to tools"
          aria-label="Back to tools"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span>Back to Tools</span>
        </button>
      </div>

      {/* List — caps at 5 items tall; extra items scroll in the thin bar. */}
      <div className="flex-1 min-h-0">
        {history.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <Copy className="w-10 h-10 text-text-muted mb-3" />
            <p className="text-text-secondary text-sm">
              No clipboard history yet
            </p>
            <p className="text-text-muted text-xs mt-1">
              Copy FEN positions to see them here
            </p>
          </div>
        ) : (
          <List
            rowCount={history.length}
            rowHeight={ITEM_HEIGHT}
            rowProps={itemData}
            rowComponent={Row}
            className="history-scrollbar"
            style={{
              height: listHeight,
              maxHeight: LIST_MAX_HEIGHT,
              width: '100%'
            }}
          />
        )}
      </div>

      {/* Footer — Clear All. */}
      {history.length > 0 && (
        <div className="pt-2 mt-1 border-t border-white/15 shrink-0">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-error hover:text-error/80 font-semibold transition-colors"
          >
            Clear All History
          </button>
        </div>
      )}
    </div>
  );
});

ClipboardHistoryPanel.displayName = 'ClipboardHistoryPanel';

export default ClipboardHistoryPanel;
