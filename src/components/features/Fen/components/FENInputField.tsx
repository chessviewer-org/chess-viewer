import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { AlertCircle } from '@/assets/icons';

import { useFENBatch } from '@/shared/contexts/FENBatchContext';
import { useFenValidation } from '@/shared/hooks/useFenValidation';
import { EMPTY_FEN, STARTING_FEN } from '@constants';

import { isPopeye } from '@/shared/utils/popeye';
import { MAX_POSITION_LENGTH, validateFEN } from '@/shared/utils/fenParser';
import { FENInputToolbar } from './FENInputToolbar';
import { useFavoriteFen } from '../hooks/useFavoriteFen';
import styles from '../styles/fen-toolbar.module.scss';

// Types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface FENInputFieldProps {
  fen: string;
  onChange: (fen: string) => void;
  onBlur?: () => void;
  error?: string;
  onPaste?: () => void;
  onNotification?: (message: string, type: NotificationType) => void;
  allowBatch?: boolean;
}

export const FENInputField = memo(
  function FENInputField({
    fen,
    onChange,
    onBlur,
    error: externalError,
    onPaste,
    onNotification,
    allowBatch = true
  }: FENInputFieldProps) {
    const { addToBatch } = useFENBatch();
    const { isFavorite, toggleFavorite } = useFavoriteFen({
      fen,
      onNotification
    });

    const [localFen, setLocalFen] = useState<string>(fen);
    const lastEmittedFenRef = useRef<string>(fen);
    const localFenRef = useRef(localFen);
    localFenRef.current = localFen;

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

    const { error: fenError } = useFenValidation(localFen, handleValidFenSync);
    const visibleError = fenError || externalError || '';

    const handleAddToBatch = useCallback(() => {
      const currentFen = localFenRef.current.trim();
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
    }, [addToBatch, onNotification]);

    const handleToggleFavorite = useCallback(
      () => toggleFavorite(localFenRef.current),
      [toggleFavorite]
    );

    const handleTextareaChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => setLocalFen(e.target.value),
      []
    );

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
        if (
          e.key === 'Enter' &&
          (!isPopeye(e.currentTarget.value) || e.ctrlKey || e.metaKey)
        ) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      },
      []
    );

    const borderColorClass = visibleError
      ? styles['inputWrapperError']
      : styles['inputWrapperNormal'];

    return (
      <div className={styles['inputContainer']}>
        <div className={`${styles['inputWrapper']} ${borderColorClass}`}>
          <FENInputToolbar
            isFavorite={isFavorite}
            onPaste={onPaste}
            onAddToBatch={allowBatch ? handleAddToBatch : undefined}
            onToggleFavorite={handleToggleFavorite}
            onStartPosition={handleStartPosition}
            onClearBoard={handleClearBoard}
          />

          <div className={styles['textareaWrapper']}>
            <textarea
              value={localFen}
              onChange={handleTextareaChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              rows={isPopeye(localFen) ? 5 : 1}
              wrap="off"
              aria-label="FEN notation input"
              aria-describedby={visibleError ? 'fen-error' : undefined}
              aria-invalid={visibleError ? 'true' : 'false'}
              style={
                isPopeye(localFen)
                  ? { height: '8rem', whiteSpace: 'pre' }
                  : undefined
              }
              className={`resize-none ${styles['textareaField']} ${visibleError ? styles['textareaFieldError'] : ''}`}
              placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              maxLength={MAX_POSITION_LENGTH}
              spellCheck="false"
              autoComplete="off"
            />
          </div>
        </div>

        <div
          className={`${styles['errorContainer']} ${
            visibleError
              ? styles['errorContainerVisible']
              : styles['errorContainerHidden']
          }`}
        >
          <div className={styles['errorContent']}>
            <div id="fen-error" className={styles['errorMessage']} role="alert">
              <AlertCircle className={styles['errorIcon']} aria-hidden="true" />
              <span>{visibleError}</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.fen === next.fen &&
    prev.error === next.error &&
    prev.onBlur === next.onBlur
);

FENInputField.displayName = 'FENInputField';
