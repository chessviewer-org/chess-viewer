import { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Check, Copy, Trash2, X } from 'lucide-react';
import { List, RowComponentProps } from 'react-window';

import { logger } from '@utils/logger';
import { safeJSONParse } from '@utils/validation';
import { useModal } from '@/contexts';

/** Row item data passed to the virtualized list renderer. */
export interface RowData {
  items: Array<string | { fen: string; timestamp: number }>;
  onSelect: (fen: string) => void;
  onCopy: (fen: string, index: number) => void;
  onRemove: (index: number) => void;
  copiedIndex: number | null;
}

const Row = ({ index, style, items, onSelect, onCopy, onRemove, copiedIndex }: RowComponentProps<RowData>) => {
  const item = items[index];
  if (!item) return null;

  const fen = typeof item === 'string' ? item : (item.fen || '');
  const timestamp = typeof item === 'string' ? undefined : item.timestamp;

  return (
    <div style={style} className="pr-2 pb-3">
      <div className="bg-bg border border-border rounded-lg p-4 hover:border-accent/50 transition-colors h-full flex flex-col justify-center">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs text-text-primary break-all mb-2 line-clamp-2">
              {fen}
            </div>
            <div className="text-xs text-text-muted">
              {timestamp ? new Date(timestamp).toLocaleString() : ''}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelect(fen)}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-bg rounded-lg text-xs font-medium transition-colors"
              title="Use this FEN"
            >
              Use
            </button>

            <button
              onClick={() => onCopy(fen, index)}
              className={`p-2 rounded-lg transition-colors ${
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
              className="p-2 rounded-lg bg-surface-elevated hover:bg-error/10 hover:text-error text-text-secondary transition-colors"
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

/** Props for the `ClipboardHistory` panel. */
export interface ClipboardHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFen?: (fen: string) => void;
}

const ClipboardHistory = memo(function ClipboardHistory({
  isOpen,
  onClose,
  onSelectFen
}: ClipboardHistoryProps) {
  const { showConfirm } = useModal();
  const [clipboardHistory, setClipboardHistory] = useState<Array<string | { fen: string; timestamp: number }>>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  const loadHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem('fenClipboardHistory');
      if (saved) {
        setClipboardHistory(safeJSONParse<Array<string | { fen: string; timestamp: number }>>(saved, []));
      }
    } catch (err) {
      logger.error('Failed to load history:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  const handleSelect = useCallback((fen: string) => {
    if (onSelectFen) {
      onSelectFen(fen);
    }
    onClose();
  }, [onSelectFen, onClose]);

  const handleCopy = useCallback((fen: string, index: number) => {
    navigator.clipboard.writeText(fen);
    setCopiedIndex(index);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const handleRemove = useCallback((index: number) => {
    setClipboardHistory((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      localStorage.setItem('fenClipboardHistory', JSON.stringify(next));
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
      setClipboardHistory([]);
      localStorage.removeItem('fenClipboardHistory');
    }
  }, [showConfirm]);

  const itemData = useMemo<RowData>(() => ({
    items: clipboardHistory,
    onSelect: handleSelect,
    onCopy: handleCopy,
    onRemove: handleRemove,
    copiedIndex
  }), [clipboardHistory, handleSelect, handleCopy, handleRemove, copiedIndex]);

  const ITEM_HEIGHT = 100;
  const listHeight = Math.min(clipboardHistory.length * ITEM_HEIGHT, 400);

  return (
    <>
      <div
        className={`fixed inset-0 z-100 flex items-end sm:items-center justify-center transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className={`relative w-full max-w-lg bg-surface border-t sm:border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 transform ${
            isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-4'
          }`}
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              Clipboard History
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <div className="p-2 max-h-[60vh] overflow-hidden">
            {clipboardHistory.length === 0 ? (
              <div className="text-center py-12 overflow-y-auto">
                <Copy className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">No clipboard history yet</p>
                <p className="text-text-muted text-sm mt-2">
                  Copy FEN positions to see them here
                </p>
              </div>
            ) : (
              <List
                rowCount={clipboardHistory.length}
                rowHeight={ITEM_HEIGHT}
                rowProps={itemData}
                rowComponent={Row}
                className="custom-scrollbar"
                style={{ height: listHeight || 104, width: '100%' }}
              />
            )}
          </div>

          {clipboardHistory.length > 0 && (
            <div className="px-6 py-4 border-t border-border shrink-0">
              <button
                onClick={handleClearAll}
                className="text-sm text-error hover:text-error/80 font-medium transition-colors"
              >
                Clear All History
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
});

ClipboardHistory.displayName = 'ClipboardHistory';

export default ClipboardHistory;
