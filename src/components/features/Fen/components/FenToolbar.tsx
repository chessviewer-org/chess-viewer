import { useLocation } from 'wouter';
import { memo, Ref, useCallback, useImperativeHandle } from 'react';

import { History, ListPlus } from '@/assets/icons';

import { FENInputField, type NotificationType } from './FENInputField';
import { useFENHistory, usePrefetchRoute } from '@/shared/hooks';

import { MAX_FEN_LENGTH } from '@/shared/utils';
import styles from '../styles/fen-toolbar.module.scss';

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

export const FenToolbar = memo(function FenToolbar({
  fen,
  setFen,
  addToFavoritesRef,
  onFavoriteStatusChange,
  onNotification,
  saveManualFen: externalSaveManualFen,
  addCurrentToFavorites: externalAddCurrentToFavorites
}: FenToolbarProps) {
  const [, navigate] = useLocation();
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
    <div className={styles['toolbarContainer']}>
      <div className={styles['toolbarInner']}>
        <div className={styles['toolbarHeader']}>
          <label className={styles['toolbarLabel']}>FEN Notation</label>
          <div className={styles['toolbarActions']}>
            <button
              type="button"
              onClick={() => navigate('/advanced-fen')}
              {...prefetch('/advanced-fen')}
              className={styles['actionBtn']}
              aria-label="Advanced FEN Input"
              title="Advanced FEN Input"
            >
              <ListPlus className={styles['actionIcon']} aria-hidden="true" />
              <span className={styles['actionLabel']}>Advanced</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/fen-history')}
              {...prefetch('/fen-history')}
              className={styles['actionBtn']}
              aria-label="FEN History"
              title="FEN History"
            >
              <History className={styles['actionIcon']} aria-hidden="true" />
              <span className={styles['actionLabel']}>History</span>
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
