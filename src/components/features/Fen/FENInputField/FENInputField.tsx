import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { AlertCircle } from 'lucide-react';

import { useFENBatch } from '@contexts';
import { useDebouncedFENValidation } from '@hooks';
import { EMPTY_FEN, STARTING_FEN } from '@constants';

import { validateFEN } from '@utils';
import { MAX_FEN_LENGTH } from '@utils';
import FENInputToolbar from './FENInputToolbar';
import { useFavoriteFen } from './useFavoriteFen';

/** Notification severity levels used by the FEN input field. */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/** Props for the `FENInputField` component. */
interface FENInputFieldProps {
  fen: string;
  onChange: (fen: string) => void;
  onBlur?: () => void;
  error?: string;
  onPaste?: () => void;
  onNotification?: (message: string, type: NotificationType) => void;
}

const FENInputField = memo(
  function FENInputField({
    fen,
    onChange,
    onBlur,
    error: externalError,
    onPaste,
    onNotification
  }: FENInputFieldProps) {
    const { addToBatch } = useFENBatch();
    const { isFavorite, toggleFavorite } = useFavoriteFen({
      fen,
      onNotification
    });

    const [localFen, setLocalFen] = useState<string>(fen);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const lastEmittedFenRef = useRef<string>(fen);

    useEffect(() => {
      if (fen !== localFen && fen !== lastEmittedFenRef.current) {
        setLocalFen(fen);
        lastEmittedFenRef.current = fen;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fen]);

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
    const visibleError = debouncedError || externalError || '';

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
      const result = addToBatch(currentFen);
      if (result === 'added') {
        onNotification?.('Added to batch', 'success');
      } else if (result === 'duplicate') {
        onNotification?.('FEN already in batch', 'warning');
      } else if (result === 'limit') {
        onNotification?.('Maximum limit of 10 FENs reached', 'error');
      } else {
        onNotification?.('Invalid FEN - cannot add to batch', 'error');
      }
    }, [localFen, addToBatch, onNotification]);

    const handleToggleFavorite = useCallback(
      () => toggleFavorite(localFen),
      [localFen, toggleFavorite]
    );

    const handleTextareaChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => setLocalFen(e.target.value),
      []
    );

    // Load a canonical position (Start Pos / Clear). Mirrors the clipboard
    // path: set the local text and emit upward; the board syncs from the FEN.
    const handleLoadFen = useCallback(
      (nextFen: string) => {
        setLocalFen(nextFen);
        lastEmittedFenRef.current = nextFen;
        onChange(nextFen);
      },
      [onChange]
    );

    const handleStartPosition = useCallback(
      () => handleLoadFen(STARTING_FEN),
      [handleLoadFen]
    );
    const handleClearBoard = useCallback(
      () => handleLoadFen(EMPTY_FEN),
      [handleLoadFen]
    );

    const handleBlur = useCallback(() => {
      if (localFen !== fen) onChange(localFen);
      onBlur?.();
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

    const borderColorClass = visibleError ? 'border-error/50' : 'border-border';

    return (
      <>
        <div className="space-y-2">
          <div
            className={`bg-surface/50 border rounded-lg overflow-hidden transition-all duration-300 ease-out ${borderColorClass}`}
          >
            <FENInputToolbar
              isFavorite={isFavorite}
              onPaste={onPaste}
              onAddToBatch={handleAddToBatch}
              onToggleFavorite={handleToggleFavorite}
              onStartPosition={handleStartPosition}
              onClearBoard={handleClearBoard}
            />

            {/* Single-line FEN field: strictly one row with horizontal scroll
                so even a max-length FEN never wraps or breaks the layout.
                (The Advanced FEN entry point now lives in the panel header.) */}
            <div className="px-2 sm:px-3 py-1 sm:py-1.5">
              <textarea
                ref={textareaRef}
                value={localFen}
                onChange={handleTextareaChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                rows={1}
                wrap="off"
                aria-label="FEN notation input"
                aria-describedby={visibleError ? 'fen-error' : undefined}
                aria-invalid={visibleError ? 'true' : 'false'}
                className={`
                  w-full min-w-0 px-1 py-1 pb-3.5 sm:pb-1
                  bg-surface/50 text-text-primary
                  font-mono text-sm sm:text-[14px] leading-tight resize-none
                  whitespace-pre overflow-x-auto overflow-y-hidden
                  focus-visible:outline-none focus:outline-none outline-none
                  transition duration-200 ease-out border-0
                  fen-scrollbar
                  ${visibleError ? 'text-error' : ''}
                `}
                placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                maxLength={MAX_FEN_LENGTH}
                spellCheck="false"
                autoComplete="off"
              />
            </div>
          </div>

          <div
            className={`grid transition-all duration-300 ease-out ${
              visibleError
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div
                id="fen-error"
                className="flex items-center gap-2 text-error text-xs mt-1"
                role="alert"
              >
                <AlertCircle
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{visibleError}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
  (prev, next) =>
    prev.fen === next.fen &&
    prev.error === next.error &&
    prev.onBlur === next.onBlur
);

FENInputField.displayName = 'FENInputField';

export default FENInputField;
