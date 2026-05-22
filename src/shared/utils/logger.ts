const isDevelopment = import.meta.env.DEV;

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
