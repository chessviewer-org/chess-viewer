import { logger } from './logger';

export enum ErrorTypes {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  CANVAS = 'CANVAS',
  STORAGE = 'STORAGE',
  CLIPBOARD = 'CLIPBOARD',
  EXPORT = 'EXPORT',
  UNKNOWN = 'UNKNOWN',
}

const USER_FRIENDLY_MESSAGES: Record<ErrorTypes, string> = {
  [ErrorTypes.VALIDATION]: 'Invalid input provided',
  [ErrorTypes.NETWORK]: 'Network error occurred. Please check your connection',
  [ErrorTypes.CANVAS]: 'Failed to render the board',
  [ErrorTypes.STORAGE]: 'Failed to save data locally',
  [ErrorTypes.CLIPBOARD]: 'Clipboard operation failed',
  [ErrorTypes.EXPORT]: 'Export operation failed',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred',
};

/**
 * Infers an ErrorType from an error's message text.
 *
 * @param {Error | null} error - The caught error
 * @returns {ErrorTypes} The categorized error type
 */
function getErrorType(error: Error | null): ErrorTypes {
  if (!error) return ErrorTypes.UNKNOWN;
  
  const message = error.message ? error.message.toLowerCase() : '';
  
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return ErrorTypes.NETWORK;
  }
  if (message.includes('canvas') || message.includes('context')) {
    return ErrorTypes.CANVAS;
  }
  if (message.includes('storage') || message.includes('quota')) {
    return ErrorTypes.STORAGE;
  }
  if (message.includes('clipboard')) {
    return ErrorTypes.CLIPBOARD;
  }
  if (message.includes('export') || message.includes('download')) {
    return ErrorTypes.EXPORT;
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return ErrorTypes.VALIDATION;
  }
  return ErrorTypes.UNKNOWN;
}

/**
 * Resolves a user-facing error message, falling back to categorized types.
 *
 * @param {Error | null} error - The caught error
 * @param {string} [customMessage] - Override message
 * @returns {string} The formatted user message
 */
export function getUserFriendlyMessage(error: Error | null, customMessage?: string): string {
  if (customMessage) return customMessage;
  const errorType = getErrorType(error);
  return USER_FRIENDLY_MESSAGES[errorType];
}

export interface ErrorHandlerOptions {
  onNotification?: (message: string, type: 'error' | 'warning' | 'info' | 'success') => void;
  customMessage?: string;
  silent?: boolean;
}

export interface ErrorInfo {
  message: string;
  context: string;
  type: string;
  timestamp: string;
  stack?: string;
}

/**
 * Centralized error handler that formats, logs, and optionally notifies the user.
 *
 * @param {Error | unknown} rawError - The error that occurred
 * @param {string} context - Execution context or module name where it failed
 * @param {ErrorHandlerOptions} [options={}] - Config for notifications and overrides
 * @returns {ErrorInfo} Structured error data
 */
export function handleError(
  rawError: Error | unknown,
  context: string,
  options: ErrorHandlerOptions = {}
): ErrorInfo {
  const { onNotification, customMessage, silent = false } = options;
  const error = rawError instanceof Error ? rawError : new Error(String(rawError));
  
  const errorInfo: ErrorInfo = {
    message: error.message || 'Unknown error',
    context,
    type: getErrorType(error),
    timestamp: new Date().toISOString(),
    stack: error.stack,
  };

  logger.error(`Error in ${context}:`, errorInfo);

  if (!silent && onNotification) {
    const userMessage = getUserFriendlyMessage(error, customMessage);
    onNotification(userMessage, 'error');
  }

  return errorInfo;
}

/**
 * Wraps an asynchronous function with automatic, standardized error handling.
 *
 * @param {Function} fn - Async function to execute
 * @param {string} context - Execution context string for logging
 * @param {ErrorHandlerOptions} [options={}] - Standard error handler options
 * @returns {Function} A wrapped async function that re-throws after handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string,
  options: ErrorHandlerOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async function wrappedFunction(...args: Parameters<T>) {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, options);
      throw error;
    }
  };
}

export interface TryCatchResult<T> {
  result: T | null;
  error: Error | null;
}

/**
 * Executes an async function and returns `{ result, error }` instead of throwing.
 *
 * @param {Function} fn - Async function to execute
 * @param {string} context - Context label for logging
 * @returns {Promise<TryCatchResult<T>>}
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  context: string
): Promise<TryCatchResult<T>> {
  try {
    const result = await fn();
    return { result, error: null };
  } catch (rawError) {
    const error = rawError instanceof Error ? rawError : new Error(String(rawError));
    logger.error(`Error in ${context}:`, error);
    return { result: null, error };
  }
}

const errorHandler = {
  ErrorTypes,
  handleError,
  getUserFriendlyMessage,
  withErrorHandling,
  tryCatch,
};

export default errorHandler;
