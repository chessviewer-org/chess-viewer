/**
 * Returns a `requestAnimationFrame`-throttled version of a callback.
 *
 * At most one pending frame is queued at a time; intermediate calls are dropped.
 * The returned function exposes a `.cancel()` method to discard any queued frame.
 *
 * @param callback - The function to throttle
 * @returns Throttled wrapper with a `.cancel()` method
 */
export function rafThrottle<T extends unknown[]>(
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
