import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@utils/logger';
import { safeJSONParse } from '@utils/validation';

/**
 * Persists state to localStorage with debounced writes to improve performance 
 * and prevent UI jank during high-frequency updates.
 *
 * @template T - The type of the value being stored
 * @param key - The unique storage key
 * @param initialValue - Default value used if the key is not found in storage
 * @returns A stateful value and a function to update it
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<T | null>(null);

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? safeJSONParse<T>(item, initialValue) : initialValue;
    } catch (error) {
      logger.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const debouncedWrite = useCallback((storageKey: string, value: T): void => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    pendingValueRef.current = value;

    debounceTimeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(value));
          pendingValueRef.current = null;
        } catch (storageError: unknown) {
          if (
            storageError instanceof Error &&
            storageError.name === 'QuotaExceededError'
          ) {
            logger.warn(
              `localStorage quota exceeded for key: ${storageKey}. Data could not be saved. Please clear some space in Settings > Data Management.`
            );
          } else {
            logger.error(`Error saving ${storageKey} to localStorage:`, storageError);
          }
        }
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        if (pendingValueRef.current !== null && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(pendingValueRef.current));
          } catch (error) {
            logger.error(`Error flushing ${key} on unmount:`, error);
          }
        }
      }
    };
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          debouncedWrite(key, valueToStore);
          return valueToStore;
        });
      } catch (error) {
        logger.error(`Error in setValue for ${key}:`, error);
      }
    },
    [key, debouncedWrite]
  );

  return [storedValue, setValue];
}
