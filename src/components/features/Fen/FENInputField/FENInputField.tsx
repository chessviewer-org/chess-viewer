import { memo, useCallback, useEffect, useRef, useState, ChangeEvent } from 'react';

import { AlertCircle } from 'lucide-react';

import ClipboardHistory from '../../ClipboardHistory';
import { useFENBatch } from '@/contexts';
import { useDebouncedFENValidation } from '@hooks/useDebouncedFENValidation';
import { validateFEN } from '@utils';
import { MAX_FEN_LENGTH } from '@utils/validation';
import FENInputToolbar from './FENInputToolbar';
import { recordClipboardHistory, useFavoriteFen } from './useFavoriteFen';

/** Notification severity levels used by the FEN input field. */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/** Props for the `FENInputField` component. */
export interface FENInputFieldProps {
  fen: string;
  onChange: (fen: string) => void;
  onBlur?: () => void;
  error?: string;
  onCopy?: () => Promise<void> | void;
  onPaste?: () => void;
  copySuccess?: boolean;
  onAdvancedClick?: () => void;
  onNotification?: (message: string, type: NotificationType) => void;
}

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
    const [isClipboardOpen, setIsClipboardOpen] = useState<boolean>(false);
    const { addToBatch } = useFENBatch();
    const { isFavorite, toggleFavorite } = useFavoriteFen({ fen, onNotification });

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

    const { debouncedError } = useDebouncedFENValidation(localFen, handleValidFenSync);
    const visibleError = debouncedError || externalError || '';

    const handleCopyWithHistory = useCallback(async () => {
      if (!onCopy) return;
      await onCopy();
      recordClipboardHistory(localFen);
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
      onNotification?.(
        success ? 'Added to batch' : 'FEN already in batch',
        success ? 'success' : 'warning'
      );
    }, [localFen, addToBatch, onNotification]);

    const handleToggleFavorite = useCallback(
      () => toggleFavorite(localFen),
      [localFen, toggleFavorite]
    );

    const handleSelectFromClipboard = useCallback(
      (selectedFen: string) => {
        setLocalFen(selectedFen);
        onChange(selectedFen);
        onNotification?.('FEN loaded from clipboard history', 'success');
      },
      [onChange, onNotification]
    );

    const handleTextareaChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => setLocalFen(e.target.value),
      []
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
              copySuccess={copySuccess}
              isFavorite={isFavorite}
              onOpenClipboard={() => setIsClipboardOpen(true)}
              onPaste={onPaste}
              onCopy={handleCopyWithHistory}
              onAddToBatch={handleAddToBatch}
              onToggleFavorite={handleToggleFavorite}
            />

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
                  font-mono text-base sm:text-[12px] leading-tight resize-none min-h-9 sm:min-h-22
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

          <div
            className={`grid transition-all duration-300 ease-out ${
              visibleError ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
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
  (prev, next) =>
    prev.fen === next.fen &&
    prev.error === next.error &&
    prev.copySuccess === next.copySuccess &&
    prev.onBlur === next.onBlur
);

FENInputField.displayName = 'FENInputField';

export default FENInputField;
