import { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { Check, Copy, Trash2, X } from 'lucide-react';
import { List } from 'react-window';

import { logger } from '@/utils/logger';
import { safeJSONParse } from '@/utils/validation';

/**
 * @param {Object} props
 * @param {number} props.index
 * @param {Object} props.style
 * @param {Object} props.data
 */
const Row = memo(({ index, style, data }) => {
  const { items, onSelect, onCopy, onRemove, copiedIndex } = data;
  const item = items[index];

  return (
    <div style={style} className="pr-2 pb-3">
      <div className="bg-bg border border-border rounded-lg p-4 hover:border-accent/50 transition-colors h-full flex flex-col justify-center">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs text-text-primary break-all mb-2 line-clamp-2">
              {item.fen}
            </div>
            <div className="text-xs text-text-muted">
              {new Date(item.timestamp).toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onSelect(item.fen)}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-bg rounded-lg text-xs font-medium transition-colors"
              title="Use this FEN"
            >
              Use
            </button>

            <button
              onClick={() => onCopy(item.fen, index)}
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
});
Row.displayName = 'Row';

/**
 * Modal drawer showing FEN strings previously copied to the clipboard.
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the drawer is visible
 * @param {Function} props.onClose - Called when the drawer should close
 * @param {Function} [props.onSelectFen] - Called with a FEN string when the user selects an entry
 * @returns {JSX.Element|null}
 */
const ClipboardHistory = memo(function ClipboardHistory({
  isOpen,
  onClose,
  onSelectFen
}) {
  const [clipboardHistory, setClipboardHistory] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const loadHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem('fenClipboardHistory');
      const history = safeJSONParse(saved, []);
      setClipboardHistory(Array.isArray(history) ? history : []);
    } catch {
      setClipboardHistory([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  const handleCopy = useCallback(async (fen, index) => {
    try {
      await navigator.clipboard.writeText(fen);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  }, []);

  const handleRemove = useCallback((index) => {
    setClipboardHistory((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem('fenClipboardHistory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSelect = useCallback(
    (fen) => {
      if (onSelectFen) {
        onSelectFen(fen);
        onClose();
      }
    },
    [onSelectFen, onClose]
  );

  const handleClearAll = useCallback(() => {
    if (window.confirm('Clear all clipboard history?')) {
      setClipboardHistory([]);
      localStorage.removeItem('fenClipboardHistory');
    }
  }, []);

  const itemData = useMemo(
    () => ({
      items: clipboardHistory,
      onSelect: handleSelect,
      onCopy: handleCopy,
      onRemove: handleRemove,
      copiedIndex
    }),
    [clipboardHistory, handleSelect, handleCopy, handleRemove, copiedIndex]
  );

  if (!isOpen) return null;

  // Approximate height calculations
  const ITEM_HEIGHT = 104; // 104px per item approximately
  const MAX_LIST_HEIGHT = window.innerHeight * 0.6; // 60vh
  const listHeight = Math.min(
    clipboardHistory.length * ITEM_HEIGHT,
    MAX_LIST_HEIGHT
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary">
                Clipboard History
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Previously copied FEN positions
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Close clipboard history"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <div className="flex-1 p-6 overflow-hidden">
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
                height={listHeight || 104}
                itemCount={clipboardHistory.length}
                itemSize={ITEM_HEIGHT}
                width="100%"
                itemData={itemData}
                className="custom-scrollbar"
              >
                {Row}
              </List>
            )}
          </div>

          {clipboardHistory.length > 0 && (
            <div className="px-6 py-4 border-t border-border flex-shrink-0">
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
