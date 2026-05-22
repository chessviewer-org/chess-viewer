import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a debounced version of `callback` that delays invocation by `delay` ms.
 *
 * @param {function} callback - Function to debounce
 * @param {number} [delay=300] - Debounce delay in milliseconds
 * @returns {function} Debounced callback
 */
export function useDebounce(callback, delay = 300) {
  const timeoutRef = useRef(null);
  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  return debouncedCallback;
}
/**
 * Runs `callback` when the main thread is idle via `requestIdleCallback`.
 *
 * @param {function} callback - Idle callback
 * @returns {void}
 */
export function useIdleCallback(callback) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  useEffect(() => {
    const fn = () => callbackRef.current();
    if ('requestIdleCallback' in window) {
      const idleCallbackId = requestIdleCallback(fn);
      return () => {
        cancelIdleCallback(idleCallbackId);
      };
    } else {
      const timeoutId = setTimeout(fn, 100);
      return () => clearTimeout(timeoutId);
    }
  }, []);
}
export default useDebounce;
