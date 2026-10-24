import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

import { isHydrating } from '@/shared/utils/hydration';
import { logger } from '@/shared/utils/logger';
import { trackPendingWrite } from '@/shared/utils/pendingWrites';
import { safeJSONParse } from '@chessviewer-org/chess-viewer';

function readStoredItem(storageKey: string): string | null {
  try {
    return window.localStorage.getItem(storageKey);
  } catch (error: unknown) {
    logger.error(`Error loading ${storageKey} from localStorage:`, error);
    return null;
  }
}

function writeToStorage<T>(storageKey: string, value: T) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      logger.warn(
        `localStorage quota exceeded for key: ${storageKey}. Data could not be saved. Please clear some space in Settings > Data Management.`
      );
    } else {
      logger.error(`Error saving ${storageKey} to localStorage:`, error);
    }
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<{ value: T } | null>(null);

  const loadedKeyRef = useRef(isHydrating() ? null : key);
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = loadedKeyRef.current === null ? null : readStoredItem(key);
    return item === null ? initialValue : safeJSONParse<T>(item, initialValue);
  });

  useLayoutEffect(() => {
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    const item = readStoredItem(key);
    if (item !== null) setStoredValue(safeJSONParse<T>(item, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Flush before the next page reads settings (Preact 11 defers passive cleanup).
  useLayoutEffect(() => {
    const flush = () => {
      if (debounceTimeoutRef.current && pendingValueRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
        writeToStorage(key, pendingValueRef.current.value);
        debounceTimeoutRef.current = null;
        pendingValueRef.current = null;
      }
    };
    const untrack = trackPendingWrite(flush);
    return () => {
      untrack();
      flush();
    };
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;

        if (Object.is(prev, valueToStore)) return prev;

        if (debounceTimeoutRef.current)
          clearTimeout(debounceTimeoutRef.current);
        pendingValueRef.current = { value: valueToStore };
        debounceTimeoutRef.current = setTimeout(() => {
          writeToStorage(key, valueToStore);
          pendingValueRef.current = null;
          debounceTimeoutRef.current = null;
        }, 300);

        return valueToStore;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}

export function useDebouncedCommit(
  delayMs: number
): (commit: () => void) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const flush = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      const commit = pendingRef.current;
      pendingRef.current = null;
      commit?.();
    };
    const untrack = trackPendingWrite(flush);
    return () => {
      untrack();
      flush();
    };
  }, []);

  return useCallback(
    (commit: () => void) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      pendingRef.current = commit;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        pendingRef.current = null;
        commit();
      }, delayMs);
    },
    [delayMs]
  );
}
