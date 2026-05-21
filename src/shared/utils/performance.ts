/**
 * Returns a requestAnimationFrame-throttled version of a callback.
 * The returned function exposes a `.cancel()` method.
 *
 * @param {Function} callback
 * @returns {Function & { cancel: () => void }}
 */
export function rafThrottle<T extends any[]>(
  callback: (...args: T) => void
): ((...args: T) => void) & { cancel: () => void } {
  let requestId: number | null = null;
  let lastArgs: T;

  function throttled(...args: T) {
    lastArgs = args;
    if (requestId === null) {
      requestId = requestAnimationFrame(() => {
        requestId = null;
        callback(...lastArgs);
      });
    }
  }

  throttled.cancel = () => {
    if (requestId !== null) {
      cancelAnimationFrame(requestId);
      requestId = null;
    }
  };

  return throttled;
}
