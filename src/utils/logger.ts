const isDevelopment = import.meta.env.DEV;

/**
 * Dev-only logger to prevent console statements from leaking into production.
 * Methods wrap native console methods but act as no-ops in non-DEV environments.
 */
export const logger = {
  /**
   * Logs general information.
   * @param {...unknown} args - Messages or objects to log
   */
  log(...args: unknown[]): void {
    if (isDevelopment) console.log(...args);
  },

  /**
   * Logs warnings.
   * @param {...unknown} args - Warnings or objects to log
   */
  warn(...args: unknown[]): void {
    if (isDevelopment) console.warn(...args);
  },

  /**
   * Logs errors.
   * @param {...unknown} args - Errors or objects to log
   */
  error(...args: unknown[]): void {
    if (isDevelopment) console.error(...args);
  },
};
