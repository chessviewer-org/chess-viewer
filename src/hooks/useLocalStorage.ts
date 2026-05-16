import { useCallback, useEffect, useRef, useState } from 'react';

import { logger } from '@/utils/logger';
import { safeJSONParse } from '@/utils/validation';

/**
 * Persists state to localStorage with debounced writes.
 *
 * @template T
 * @param {string} key - Storage key
 * @param {T} initialValue - Default value when key is absent
 * @returns {[T, React.Dispatch<React.SetStateAction<T>>]} [storedValue, setValue]
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const debouncedWrite = useCallback((storageKey: string, value: T) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    pendingValueRef.current = value;

    debounceTimeoutRef.current = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(value));
          pendingValueRef.current = null;
        } catch (storageError: any) {
          if (storageError?.name === 'QuotaExceededError') {
            logger.warn(`localStorage quota exceeded for key: ${storageKey}. Clearing old data.`);
            try {
              const keys = Object.keys(window.localStorage);
              if (keys.length > 0) {
                window.localStorage.removeItem(keys[0]);
                window.localStorage.setItem(storageKey, JSON.stringify(value));
              }
            } catch (retryError) {
              logger.error(`Failed to save ${storageKey} even after cleanup:`, retryError);
            }
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

/**
 * Persists state using cloud storage when available, falling back to localStorage.
 *
 * @template T
 * @param {string} key - Storage key
 * @param {T} initialValue - Default value when key is absent
 * @param {boolean} [useCloudStorage=false] - Prefer cloud storage when window.storage is available
 * @returns {[T, (value: T | ((val: T) => T)) => Promise<void>, boolean]} [storedValue, setValue, isLoading]
 */
export function useHybridStorage<T>(
  key: string,
  initialValue: T,
  useCloudStorage = false
): [T, (value: T | ((val: T) => T)) => Promise<void>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (useCloudStorage && window.storage && typeof window.storage.get === 'function') {
          const result = await window.storage.get(key);
          if (result && typeof result.value === 'string') {
            const parsed = safeJSONParse<T | null>(result.value, null);
            if (parsed !== null) {
              setStoredValue(parsed);
              setIsLoading(false);
              return;
            }
          }
        }
        
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = safeJSONParse<T | null>(item, null);
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

  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      const jsonValue = JSON.stringify(valueToStore);
      
      try {
        window.localStorage.setItem(key, jsonValue);
      } catch (storageError: any) {
        if (storageError?.name === 'QuotaExceededError') {
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
      
      if (useCloudStorage && window.storage && typeof window.storage.set === 'function') {
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
