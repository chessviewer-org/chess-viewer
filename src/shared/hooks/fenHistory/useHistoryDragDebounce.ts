import { useCallback, useEffect, useRef } from 'react';

import type { HistorySource } from '@app-types/history';

const DRAG_INACTIVITY_TIMEOUT = 60000;

/** Arguments for `useHistoryDragDebounce`. */
interface UseHistoryDragDebounceArgs {
  commitToHistory: (
    fenToSave: string,
    source: HistorySource,
    dragSessionId?: string | null
  ) => void;
  latestFenRef: React.MutableRefObject<string>;
}

/**
 * Debounces drag-originated FEN history commits.
 *
 * A single history entry is committed per drag session after 60 seconds of
 * inactivity; consecutive drag moves within that window are collapsed.
 */
export function useHistoryDragDebounce({
  commitToHistory,
  latestFenRef
}: UseHistoryDragDebounceArgs) {
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    };
  }, []);

  const notifyDragAction = useCallback(() => {
    if (!dragSessionIdRef.current)
      dragSessionIdRef.current = `drag-${Date.now()}`;
    if (dragTimerRef.current) clearTimeout(dragTimerRef.current);

    const sessionId = dragSessionIdRef.current;
    dragTimerRef.current = setTimeout(() => {
      commitToHistory(latestFenRef.current, 'drag', sessionId);
      dragTimerRef.current = null;
      dragSessionIdRef.current = null;
    }, DRAG_INACTIVITY_TIMEOUT);
  }, [commitToHistory, latestFenRef]);

  const cancelDragTimer = useCallback(() => {
    if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    dragSessionIdRef.current = null;
  }, []);

  return { notifyDragAction, cancelDragTimer };
}
