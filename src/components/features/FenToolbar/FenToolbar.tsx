import { memo, Ref, useCallback, useImperativeHandle } from 'react';

import { History, ListPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import type { NotificationType } from '@/components/features/Fen';
import { FENInputField } from '@/components/features/Fen';
import { useFENHistory, usePrefetchRoute } from '@hooks';

import { MAX_FEN_LENGTH } from '@utils';

interface FenToolbarProps {
  fen: string;
  setFen: (fen: string) => void;
  addToFavoritesRef?: Ref<() => void>;
  onFavoriteStatusChange?: (status: boolean) => void;
  onNotification?: (message: string, type: NotificationType) => void;
  saveManualFen?: (fen: string) => void;
  saveExportFen?: (fen: string) => void;
  addCurrentToFavorites?: (
    fen: string,
    notify?: (message: string, type: NotificationType) => void
  ) => void;
}

const FenToolbar = memo(function FenToolbar({
  fen,
  setFen,
  addToFavoritesRef,
  onFavoriteStatusChange,
  onNotification,
  saveManualFen: externalSaveManualFen,
  addCurrentToFavorites: externalAddCurrentToFavorites
}: FenToolbarProps) {
  const navigate = useNavigate();
  const prefetch = usePrefetchRoute();

  const localHistory = useFENHistory(fen, onFavoriteStatusChange);
  const addCurrentToFavorites =
    externalAddCurrentToFavorites ?? localHistory.addCurrentToFavorites;

  const handleFenChange = useCallback(
    (nextValue: string) => {
      setFen(
        nextValue.length > MAX_FEN_LENGTH
          ? nextValue.slice(0, MAX_FEN_LENGTH)
          : nextValue
      );
    },
    [setFen]
  );

  const handleFenBlur = useCallback(() => {
    if (externalSaveManualFen && fen && fen.trim()) {
      externalSaveManualFen(fen.trim());
    }
  }, [fen, externalSaveManualFen]);

  const handlePasteFEN = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const rawFen = text.trim();
        const pastedFen =
          rawFen.length > MAX_FEN_LENGTH
            ? rawFen.slice(0, MAX_FEN_LENGTH)
            : rawFen;

        setFen(pastedFen);
        if (externalSaveManualFen) {
          externalSaveManualFen(pastedFen);
        }

        if (rawFen.length > MAX_FEN_LENGTH) {
          onNotification?.(
            `FEN too long — truncated to ${MAX_FEN_LENGTH} chars`,
            'warning'
          );
        } else {
          onNotification?.('FEN pasted successfully', 'success');
        }
      }
    } catch {
      onNotification?.('Failed to paste from clipboard', 'error');
    }
  }, [setFen, externalSaveManualFen, onNotification]);

  useImperativeHandle(
    addToFavoritesRef,
    () => () => addCurrentToFavorites(fen, onNotification)
  );

  return (
    <div className="bg-surface border border-border/40 rounded-xl px-fluid-sm py-2.5 sm:py-3">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-fluid-sm font-semibold text-text-primary">
            FEN Notation
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/advanced-fen')}
              {...prefetch('/advanced-fen')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 coarse:min-h-11 rounded-lg text-accent text-fluid-xs font-medium transition-colors duration-150 border border-accent/20 bg-accent/5 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="Advanced FEN Input"
              title="Advanced FEN Input"
            >
              <ListPlus className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span>Advanced</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/fen-history')}
              {...prefetch('/fen-history')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 coarse:min-h-11 rounded-lg text-accent text-fluid-xs font-medium transition-colors duration-150 border border-accent/20 bg-accent/5 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="FEN History"
              title="FEN History"
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span>History</span>
            </button>
          </div>
        </div>

        <FENInputField
          fen={fen}
          onChange={handleFenChange}
          onBlur={handleFenBlur}
          onPaste={handlePasteFEN}
          {...(onNotification && { onNotification })}
        />
      </div>
    </div>
  );
});

FenToolbar.displayName = 'FenToolbar';
export default FenToolbar;
