import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useFENBatch } from '@/contexts';
import { useDebouncedFENValidation } from '@hooks/useDebouncedFENValidation';
import { validateFEN } from '@utils';
import { logger } from '@utils/logger';
import { isRecord, safeJSONParse } from '@utils/validation';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface FENHistoryEntry {
  fen: string;
  timestamp: number;
}

export interface UseFENInputFieldProps {
  fen: string;
  onChange: (fen: string) => void;
  onBlur?: (() => void) | undefined;
  error?: string | undefined;
  onCopy?: (() => Promise<void> | void) | undefined;
  onNotification?: ((message: string, type: NotificationType) => void) | undefined;
}

/**
 * Custom hook to manage the business logic, state, and interaction handlers for a FEN input field.
 *
 * Handles:
 * - Local input buffering for lag-free typing
 * - Debounced FEN validation and global state sync
 * - Favorites toggle persistence in localStorage
 * - Copying with local FEN clipboard history tracking
 * - Batch queue addition
 *
 * @param props - Custom hook options including FEN value, parent sync, copy/notification delegates
 * @returns State variables, refs, and action handlers for the FEN presentation layer
 */
export function useFENInputField({
  fen,
  onChange,
  onBlur,
  error: externalError,
  onCopy,
  onNotification,
}: UseFENInputFieldProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isClipboardOpen, setIsClipboardOpen] = useState<boolean>(false);
  const { addToBatch } = useFENBatch();

  // Local state for instant, lag-free typing
  const [localFen, setLocalFen] = useState<string>(fen);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastEmittedFenRef = useRef<string>(fen);

  // Sync local state when external prop changes (e.g. board drag, paste)
  // but NOT if the change is just the parent reflecting what we just emitted.
  useEffect(() => {
    if (fen !== localFen && fen !== lastEmittedFenRef.current) {
      setLocalFen(fen);
      lastEmittedFenRef.current = fen;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  // Debounced validation + board sync
  const handleValidFenSync = useCallback(
    (validFen: string) => {
      lastEmittedFenRef.current = validFen;
      onChange(validFen);
    },
    [onChange]
  );

  const { debouncedError } = useDebouncedFENValidation(
    localFen,
    handleValidFenSync
  );

  // Combine internal debounced error with any external error
  const visibleError = debouncedError || externalError || '';

  // Favorites check
  useEffect(() => {
    const rawFavorites = safeJSONParse(
      localStorage.getItem('favoriteFens'),
      {} as Record<string, boolean>
    );
    setIsFavorite(!!rawFavorites[fen]);
  }, [fen]);

  const handleCopyWithHistory = useCallback(async () => {
    if (onCopy) {
      await onCopy();

      const currentFen = localFen.trim();
      if (currentFen && validateFEN(currentFen)) {
        const rawHistory = safeJSONParse(
          localStorage.getItem('fenClipboardHistory'),
          [] as FENHistoryEntry[]
        );

        const history = Array.isArray(rawHistory) ? rawHistory : [];

        const newEntry: FENHistoryEntry = {
          fen: currentFen,
          timestamp: Date.now(),
        };

        try {
          const updatedHistory = [
            newEntry,
            ...history.filter((item: FENHistoryEntry) => item.fen !== currentFen),
          ].slice(0, 50);

          localStorage.setItem(
            'fenClipboardHistory',
            JSON.stringify(updatedHistory)
          );
        } catch (err) {
          logger.error('Failed to save to clipboard history:', err);
        }
      }
    }
  }, [localFen, onCopy]);

  const handleAddToBatch = useCallback(() => {
    const currentFen = localFen.trim();
    if (!currentFen) {
      onNotification?.('FEN is empty', 'error');
      return;
    }

    if (!validateFEN(currentFen)) {
      onNotification?.('Invalid FEN - cannot add to batch', 'error');
      return;
    }

    const success = addToBatch(currentFen);
    if (success) {
      onNotification?.('Added to batch', 'success');
    } else {
      onNotification?.('FEN already in batch', 'warning');
    }
  }, [localFen, addToBatch, onNotification]);

  const handleToggleFavorite = useCallback(() => {
    const currentFen = localFen.trim();
    if (!currentFen) {
      onNotification?.('FEN is empty', 'error');
      return;
    }

    if (!validateFEN(currentFen)) {
      onNotification?.('Invalid FEN - cannot favorite', 'error');
      return;
    }

    try {
      const rawFavorites = safeJSONParse(
        localStorage.getItem('favoriteFens'),
        {}
      );

      const favorites: Record<string, boolean> = {};
      if (isRecord(rawFavorites)) {
        for (const key in rawFavorites) {
          if (Object.prototype.hasOwnProperty.call(rawFavorites, key)) {
            favorites[key] = Boolean(rawFavorites[key]);
          }
        }
      }

      const newFavoriteState = !favorites[currentFen];

      if (newFavoriteState) {
        favorites[currentFen] = true;
      } else {
        delete favorites[currentFen];
      }

      localStorage.setItem('favoriteFens', JSON.stringify(favorites));
      setIsFavorite(newFavoriteState);
      onNotification?.(
        newFavoriteState ? 'Added to favorites' : 'Removed from favorites',
        'success'
      );
    } catch {
      onNotification?.('Failed to update favorites', 'error');
    }
  }, [localFen, onNotification]);

  const handleSelectFromClipboard = useCallback(
    (selectedFen: string) => {
      setLocalFen(selectedFen);
      if (onChange) {
        onChange(selectedFen);
        onNotification?.('FEN loaded from clipboard history', 'success');
      }
    },
    [onChange, onNotification]
  );

  const handleTextareaChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setLocalFen(e.target.value);
    },
    []
  );

  const handleBlur = useCallback(() => {
    if (localFen !== fen) {
      onChange(localFen);
    }
    if (onBlur) {
      onBlur();
    }
  }, [localFen, fen, onChange, onBlur]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    []
  );

  const borderColorClass = visibleError ? 'border-error/50' : 'border-border';

  return {
    localFen,
    setLocalFen,
    textareaRef,
    isFavorite,
    isClipboardOpen,
    setIsClipboardOpen,
    visibleError,
    borderColorClass,
    handleCopyWithHistory,
    handleAddToBatch,
    handleToggleFavorite,
    handleSelectFromClipboard,
    handleTextareaChange,
    handleBlur,
    handleKeyDown,
  };
}
