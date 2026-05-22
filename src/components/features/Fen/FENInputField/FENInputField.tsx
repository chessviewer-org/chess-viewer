import { memo, useCallback, useEffect, useRef, useState, ChangeEvent } from 'react';

import {
  AlertCircle,
  CheckCircle,
  Clipboard,
  Copy,
  Heart,
  List,
  Plus
} from 'lucide-react';

import ClipboardHistory from '../../ClipboardHistory';
import { useFENBatch } from '@/contexts';
import { useDebouncedFENValidation } from '@hooks/useDebouncedFENValidation';
import { validateFEN } from '@utils';
import { logger } from '@utils/logger';
import { isRecord, MAX_FEN_LENGTH, safeJSONParse } from '@utils/validation';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface FENInputFieldProps {
  /** Current FEN string value */
  fen: string;
  /** Called when the field value should sync to the global state */
  onChange: (fen: string) => void;
  /** Called when the field loses focus */
  onBlur?: () => void;
  /** LEGACY: External error prop — still honoured if supplied */
  error?: string;
  /** Copies the FEN to clipboard */
  onCopy?: () => Promise<void> | void;
  /** Pastes FEN from clipboard */
  onPaste?: () => void;
  /** Briefly true after a successful copy */
  copySuccess?: boolean;
  /** Navigates to the advanced FEN input page */
  onAdvancedClick?: () => void;
  /** Called with `(message, type)` to surface a toast */
  onNotification?: (message: string, type: NotificationType) => void;
}

export interface FENHistoryEntry {
  fen: string;
  timestamp: number;
}

/**
 * FEN string input field with copy, paste, batch-add, favorites, and clipboard history actions.
 *
 * Validation is **debounced at 500 ms** so that errors appear only after the
 * user pauses typing.  Board sync is debounced at 200 ms and only fires when
 * the FEN is fully valid.
 */
const FENInputField = memo(
  function FENInputField({
    fen,
    onChange,
    onBlur,
    error: externalError,
    onCopy,
    onPaste,
    copySuccess,
    onAdvancedClick,
    onNotification
  }: FENInputFieldProps) {
    const [isFavorite, setIsFavorite] = useState<boolean>(false);
    const [isClipboardOpen, setIsClipboardOpen] = useState<boolean>(false);
    const { addToBatch } = useFENBatch();

    // ── Local state for instant, lag-free typing ──
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

    // ── Debounced validation + board sync ──
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

    // ── Favorites check ──
    useEffect(() => {
      try {
        const rawFavorites = safeJSONParse(
          localStorage.getItem('favoriteFens'),
          {}
        );
        if (isRecord(rawFavorites)) {
          setIsFavorite(!!rawFavorites[fen]);
        } else {
          setIsFavorite(false);
        }
      } catch {
        setIsFavorite(false);
      }
    }, [fen]);

    const handleCopyWithHistory = useCallback(async () => {
      if (onCopy) {
        await onCopy();

        const currentFen = localFen.trim();
        if (currentFen && validateFEN(currentFen)) {
          try {
            const rawHistory = safeJSONParse<unknown[]>(
              localStorage.getItem('fenClipboardHistory'),
              []
            );

            const history: FENHistoryEntry[] = Array.isArray(rawHistory)
              ? rawHistory.filter(
                  (item: unknown): item is FENHistoryEntry =>
                    isRecord(item) &&
                    typeof item['fen'] === 'string' &&
                    typeof item['timestamp'] === 'number'
                )
              : [];

            const newEntry: FENHistoryEntry = {
              fen: currentFen,
              timestamp: Date.now()
            };

            const updatedHistory = [
              newEntry,
              ...history.filter((item) => item.fen !== currentFen)
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

    // ── Textarea handlers ──
    const handleTextareaChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        // Instantly update local UI only — debounce handles the rest
        setLocalFen(e.target.value);
      },
      []
    );

    const handleBlur = useCallback(() => {
      // On blur, always sync the current local value to global state
      if (localFen !== fen) {
        onChange(localFen);
      }
      if (onBlur) {
        onBlur();
      }
    }, [localFen, fen, onChange, onBlur]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      },
      []
    );

    // ── Border color logic ──
    const borderColorClass = visibleError ? 'border-error/50' : 'border-border';

    return (
      <>
        <div className="space-y-2">
          <div
            className={`bg-surface/50 border rounded-lg overflow-hidden transition-all duration-300 ease-out ${borderColorClass}`}
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-surface-elevated border-b border-border">
              <button
                onClick={() => setIsClipboardOpen(true)}
                className="p-1.5 sm:p-2 rounded-md transition duration-150 ease-out active:scale-95 hover:bg-opacity-80 bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-9 sm:min-h-10"
                title="View clipboard history"
                aria-label="View clipboard history"
                type="button"
              >
                <List
                  className="w-3.5 h-3.5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </button>

              <button
                onClick={onPaste}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition duration-150 ease-out active:scale-95 hover:bg-opacity-80 bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-accent text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-9 sm:min-h-10"
                title="Paste FEN from clipboard"
                aria-label="Paste FEN from clipboard"
                type="button"
              >
                <Clipboard
                  className="w-3.5 h-3.5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">Paste</span>
              </button>

              <button
                onClick={handleCopyWithHistory}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition duration-150 ease-out active:scale-95 hover:bg-opacity-80 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-9 sm:min-h-10 ${
                  copySuccess
                    ? 'bg-success/20 text-success border border-success/30'
                    : 'bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-accent'
                }`}
                title={copySuccess ? 'Copied!' : 'Copy FEN to clipboard'}
                aria-label={
                  copySuccess
                    ? 'FEN copied to clipboard'
                    : 'Copy FEN to clipboard'
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
                    <Copy
                      className="w-3.5 h-3.5"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleAddToBatch}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition duration-150 ease-out active:scale-95 hover:bg-opacity-80 bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-accent text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-9 sm:min-h-10"
                title="Add to batch (no redirect)"
                aria-label="Add to batch"
                type="button"
              >
                <Plus
                  className="w-3.5 h-3.5"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">Add</span>
              </button>

              <button
                onClick={handleToggleFavorite}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition duration-150 ease-out active:scale-95 hover:bg-opacity-80 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent min-h-9 sm:min-h-10 ${
                  isFavorite
                    ? 'bg-error/20 text-error border border-error/30'
                    : 'bg-surface hover:bg-surface-hover border border-border/50 text-text-secondary hover:text-error'
                }`}
                title={
                  isFavorite ? 'Remove from favorites' : 'Add to favorites'
                }
                aria-label={
                  isFavorite ? 'Remove from favorites' : 'Add to favorites'
                }
                type="button"
              >
                <Heart
                  className={`w-3.5 h-3.5 transition duration-200 ease-out ${isFavorite ? 'scale-110' : 'scale-100'}`}
                  strokeWidth={2.5}
                  fill={isFavorite ? 'currentColor' : 'none'}
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={localFen}
                onChange={handleTextareaChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                aria-label="FEN notation input"
                aria-describedby={visibleError ? 'fen-error' : undefined}
                aria-invalid={visibleError ? 'true' : 'false'}
                className={`
                  w-full px-2 sm:px-3 py-1.5 sm:py-2 pb-8 sm:pb-9
                  bg-surface/50 text-text-primary
                  font-mono text-base sm:text-[12px] leading-tight resize-none min-h-9 sm:min-h-[5.5rem]
                  focus-visible:outline-none focus:outline-none outline-none
                  transition duration-200 ease-out border-0
                  ${visibleError ? 'text-error' : ''}
                `}
                placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                maxLength={MAX_FEN_LENGTH}
                spellCheck="false"
                autoComplete="off"
              />

              <button
                onClick={onAdvancedClick}
                className="absolute bottom-2 right-2 text-[11px] sm:text-[12px] text-accent/80 hover:text-accent font-semibold transition duration-150 ease-out active:scale-95 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-1 py-0.5 bg-surface/80 backdrop-blur-sm"
                type="button"
                aria-label="Open advanced FEN input modal"
              >
                Advanced FEN Input
              </button>
            </div>
          </div>

          {/* Error message — slides in smoothly */}
          <div
            className={`
              grid transition-all duration-300 ease-out
              ${visibleError ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
            `}
          >
            <div className="overflow-hidden">
              <div
                id="fen-error"
                className="flex items-center gap-2 text-error text-xs mt-1"
                role="alert"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{visibleError}</span>
              </div>
            </div>
          </div>

        </div>

        {isClipboardOpen && (
          <ClipboardHistory
            isOpen={isClipboardOpen}
            onClose={() => setIsClipboardOpen(false)}
            onSelectFen={handleSelectFromClipboard}
          />
        )}
      </>
    );
  },
  (prevProps: FENInputFieldProps, nextProps: FENInputFieldProps) => {
    return (
      prevProps.fen === nextProps.fen &&
      prevProps.error === nextProps.error &&
      prevProps.copySuccess === nextProps.copySuccess &&
      prevProps.onBlur === nextProps.onBlur
    );
  }
);

FENInputField.displayName = 'FENInputField';

export default FENInputField;
