import { useEffect, useRef, useState } from 'react';

import { validateFEN, validateFENDetailed } from '@/utils';

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
 * - While the user types, no validation feedback is shown.
 * - After 500 ms of inactivity the *first* error is surfaced.
 * - Once the user fixes that error, the next one appears on the following
 *   idle cycle — errors are never stacked.
 * - When the FEN is fully valid AND the user has been idle for 200 ms,
 *   `onValidFen` fires to push the value to the board.
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

  // Refs keep timer IDs across renders without causing re-renders
  const validationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onValidFenRef = useRef(onValidFen);

  // Always point at the latest callback without invalidating the effect
  useEffect(() => {
    onValidFenRef.current = onValidFen;
  }, [onValidFen]);

  // Core debounce effect — runs on every keystroke
  useEffect(() => {
    // Cancel any pending timers from the previous keystroke
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    if (boardSyncTimerRef.current) clearTimeout(boardSyncTimerRef.current);

    const trimmed = localFen.trim();

    // Empty input → reset everything silently
    if (trimmed.length === 0) {
      setDebouncedError(null);
      setIsValid(false);
      return;
    }

    // --- Validation debounce (500 ms) ---
    validationTimerRef.current = setTimeout(() => {
      const result = validateFENDetailed(trimmed);

      if (result.isValid) {
        setDebouncedError(null);
        setIsValid(true);
      } else {
        // Show only the first error — the user fixes one thing at a time
        setDebouncedError(result.errorMessage);
        setIsValid(false);
      }
    }, VALIDATION_DELAY_MS);

    // --- Board sync debounce (200 ms) — only if valid ---
    boardSyncTimerRef.current = setTimeout(() => {
      if (validateFEN(trimmed)) {
        onValidFenRef.current(trimmed);
      }
    }, BOARD_SYNC_DELAY_MS);

    // Cleanup on unmount or next keystroke
    return () => {
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
      if (boardSyncTimerRef.current) clearTimeout(boardSyncTimerRef.current);
    };
  }, [localFen]);

  return { debouncedError, isValid };
}
