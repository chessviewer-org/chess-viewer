import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@/utils/logger';
import { safeJSONParse } from '@/utils/validation';

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
      const item = window.localStorage.getItem(key);
      return item ? safeJSONParse(item, initialValue) : initialValue;
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
/**
 * Persists state using cloud storage when available, falling back to localStorage.
 *
 * @param {string} key - Storage key
 * @param {*} initialValue - Default value when key is absent
 * @param {boolean} [useCloudStorage=false] - Prefer cloud storage when window.storage is available
 * @returns {[*, function(*): void, boolean]} [storedValue, setValue, isLoading]
 */
export function useHybridStorage(key, initialValue, useCloudStorage = false) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (
          useCloudStorage &&
          window.storage &&
          typeof window.storage.get === 'function'
        ) {
          const result = await window.storage.get(key);
          if (result && typeof result.value === 'string') {
            const parsed = safeJSONParse(result.value, null);
            if (parsed !== null) {
              setStoredValue(parsed);
              setIsLoading(false);
              return;
            }
          }
        }
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = safeJSONParse(item, null);
          if (parsed !== null) {
            setStoredValue(parsed);
          }
        }
      } catch (error) {
        logger.error(`Error loading ${key}:`, error);
      }
      setIsLoading(false);
    };
    loadData();
  }, [key, useCloudStorage]);
  const setValue = async (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      const jsonValue = JSON.stringify(valueToStore);
      try {
        window.localStorage.setItem(key, jsonValue);
      } catch (storageError) {
        if (storageError.name === 'QuotaExceededError') {
          logger.warn(`localStorage quota exceeded for key: ${key}`);
          const keys = Object.keys(window.localStorage);
          if (keys.length > 0) {
            window.localStorage.removeItem(keys[0]);
            window.localStorage.setItem(key, jsonValue);
          }
        } else {
          throw storageError;
        }
      }
      if (
        useCloudStorage &&
        window.storage &&
        typeof window.storage.set === 'function'
      ) {
        try {
          await window.storage.set(key, jsonValue);
        } catch (cloudError) {
          logger.warn(`Cloud storage failed for key: ${key}`, cloudError);
        }
      }
    } catch (error) {
      logger.error(`Error saving ${key}:`, error);
    }
  };
  return [storedValue, setValue, isLoading];
}
