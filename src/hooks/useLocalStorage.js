import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@/utils/logger';
import { getStoredValue } from '@/utils/validation';

/**
 * Persists state to localStorage with debounced writes.
 *
 * @param {string} key - Storage key
 * @param {*} initialValue - Default value when key is absent
 * @returns {[*, function(*): void, boolean]} [storedValue, setValue, isLoading]
 */
export function useLocalStorage(key, initialValue) {
  const debounceTimeoutRef = useRef(null);
  const pendingValueRef = useRef(null);
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      return getStoredValue(key, initialValue);
    } catch (error) {
      logger.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });
  const debouncedWrite = useCallback((key, value) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    pendingValueRef.current = value;
    debounceTimeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
          pendingValueRef.current = null;
        } catch (storageError) {
          if (storageError.name === 'QuotaExceededError') {
            logger.warn(
              `localStorage quota exceeded for key: ${key}. Clearing old data.`
            );
            try {
              const keys = Object.keys(window.localStorage);
              if (keys.length > 0) {
                window.localStorage.removeItem(keys[0]);
                window.localStorage.setItem(key, JSON.stringify(value));
              }
            } catch (retryError) {
              logger.error(
                `Failed to save ${key} even after cleanup:`,
                retryError
              );
            }
          } else {
            logger.error(`Error saving ${key} to localStorage:`, storageError);
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
            window.localStorage.setItem(
              key,
              JSON.stringify(pendingValueRef.current)
            );
          } catch (error) {
            logger.error(`Error flushing ${key} on unmount:`, error);
          }
        }
      }
    };
  }, [key]);
  const setValue = useCallback(
    (value) => {
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
