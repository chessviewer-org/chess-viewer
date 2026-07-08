import {
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { AlertCircle } from '@/assets/icons';

import { useFENBatch } from '@contexts';
import { useFenValidation } from '@/shared/hooks';
import { EMPTY_FEN, STARTING_FEN } from '@constants';

import { MAX_FEN_LENGTH, validateFEN } from '@/shared/utils';
import { FENInputToolbar } from './FENInputToolbar';
import { useFavoriteFen } from '../hooks/useFavoriteFen';
import styles from '../styles/fen-toolbar.module.scss';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface FENInputFieldProps {
  fen: string;
  onChange: (fen: string) => void;
  onBlur?: () => void;
  error?: string;
  onPaste?: () => void;
  onNotification?: (message: string, type: NotificationType) => void;
}

export const FENInputField = memo(
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

    const { error: fenError } = useFenValidation(localFen, handleValidFenSync);
    const visibleError = fenError || externalError || '';

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

    const borderColorClass = visibleError
      ? styles['inputWrapperError']
      : styles['inputWrapperNormal'];

    return (
      <div className={styles['inputContainer']}>
        <div className={`${styles['inputWrapper']} ${borderColorClass}`}>
          <FENInputToolbar
            isFavorite={isFavorite}
            onPaste={onPaste}
            onAddToBatch={handleAddToBatch}
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
              rows={1}
              wrap="off"
              aria-label="FEN notation input"
              aria-describedby={visibleError ? 'fen-error' : undefined}
              aria-invalid={visibleError ? 'true' : 'false'}
              className={`fen-scrollbar ${styles['textareaField']} ${visibleError ? styles['textareaFieldError'] : ''}`}
              placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
              maxLength={MAX_FEN_LENGTH}
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
