import { useCallback, useEffect, useRef, useState } from 'react';

import { logger, safeJSONParse } from '@/shared/utils';

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
  const pendingValueRef = useRef<T | null>(null);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? safeJSONParse<T>(item, initialValue) : initialValue;
    } catch (error: unknown) {
      logger.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current && pendingValueRef.current !== null) {
        clearTimeout(debounceTimeoutRef.current);
        writeToStorage(key, pendingValueRef.current);
      }
    };
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;

        if (debounceTimeoutRef.current)
          clearTimeout(debounceTimeoutRef.current);
        pendingValueRef.current = valueToStore;
        debounceTimeoutRef.current = setTimeout(() => {
          writeToStorage(key, valueToStore);
          pendingValueRef.current = null;
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (commit: () => void) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(commit, delayMs);
    },
    [delayMs]
  );
}
