import { useEffect, useRef, useState } from 'react';

import { validateFEN, validateFENDetailed } from '@utils';

/**
 * Validation delay before showing an error message (ms).
 * Gives the user breathing room while typing.
 */
const VALIDATION_DELAY_MS = 500;

/**
 * Delay after a valid FEN before syncing to the board (ms).
 * Prevents the board from thrashing while the user is still editing.
 */
const BOARD_SYNC_DELAY_MS = 200;

export interface DebouncedFENState {
  /** Error message to display (null = no error visible yet) */
  debouncedError: string | null;
  /** Whether the current local value is a valid FEN */
  isValid: boolean;
}

/**
 * Debounces FEN validation (500 ms) and board synchronisation (200 ms).
 *
 * @param localFen       The current (unsaved) value in the textarea
 * @param onValidFen     Callback fired with a valid FEN to sync to the board
 */
export function useDebouncedFENValidation(
  localFen: string,
  onValidFen: (fen: string) => void
): DebouncedFENState {
  const [debouncedError, setDebouncedError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(() => {
    const trimmed = localFen.trim();
    return trimmed.length > 0 && validateFEN(trimmed);
  });

  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onValidFenRef = useRef(onValidFen);

  useEffect(() => {
    onValidFenRef.current = onValidFen;
  }, [onValidFen]);

  useEffect(() => {
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    if (boardSyncTimerRef.current) clearTimeout(boardSyncTimerRef.current);

    const trimmed = localFen.trim();

    if (trimmed.length === 0) {
      setDebouncedError(null);
      setIsValid(false);
      return;
    }

    validationTimerRef.current = setTimeout(() => {
      const result = validateFENDetailed(trimmed);

      if (result.isValid) {
        setDebouncedError(null);
        setIsValid(true);
      } else {
        setDebouncedError(result.errorMessage);
        setIsValid(false);
      }
    }, VALIDATION_DELAY_MS);

    boardSyncTimerRef.current = setTimeout(() => {
      if (validateFEN(trimmed)) {
        onValidFenRef.current(trimmed);
      }
    }, BOARD_SYNC_DELAY_MS);

    return () => {
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
      if (boardSyncTimerRef.current) clearTimeout(boardSyncTimerRef.current);
    };
  }, [localFen]);

  return { debouncedError, isValid };
}
