const isDevelopment = import.meta.env.DEV;

/**
 * Structured application logger.
 *
 * `log` and `warn` are suppressed in production; `error` always surfaces to
 * avoid silently swallowing runtime failures.
 */
export const logger = {
  log(...args: unknown[]): void {
    if (isDevelopment) console.log(...args);
  },

  warn(...args: unknown[]): void {
    if (isDevelopment) console.warn(...args);
  },

  // Always logs errors — silent production errors mask real failures.
  error(...args: unknown[]): void {
    console.error(...args);
  },
};
