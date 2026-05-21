/**
 * Maximum allowed length for a FEN string before any parsing attempt.
 */
export const MAX_FEN_LENGTH = 93;

/** Keys that would pollute the prototype chain. */
const PROTOTYPE_POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Prototype-pollution-safe JSON parser.
 * Drops keys that would pollute the prototype chain.
 *
 * @template T
 * @param jsonString - Raw JSON string
 * @param fallback - Fallback value on parse failure
 * @returns Parsed object or fallback
 */
export function safeJSONParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(jsonString, (key, value) => {
      if (key !== '' && PROTOTYPE_POISON_KEYS.has(key)) {
        return undefined;
      }
      return value;
    });
    return (parsed !== null && parsed !== undefined) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Strips unsafe filename characters and enforces a max length of 100.
 *
 * @param fileName - The original filename string
 * @returns Safe filename
 */
export function sanitizeFileName(fileName?: string | null): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'chess-position';
  }
  let sanitized = fileName.replace(/[\\/:*?"<>|&]/g, '-');
  sanitized = sanitized.replace(/\s+/g, '_');
  sanitized = sanitized.replace(/^\.+/, '');
  sanitized = sanitized.replace(/\.+$/, '');
  sanitized = sanitized.trim();
  
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  if (!sanitized) {
    return 'chess-position';
  }
  return sanitized;
}

/** 
 * Checks if color is a valid 6-digit hex string.
 * 
 * @param color - The color value to validate
 * @returns True if the value is a valid hex color string
 */
export function isValidHexColor(color: unknown): color is string {
  if (!color || typeof color !== 'string') return false;
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/** 
 * Returns the color if it is a valid hex, otherwise returns the fallback.
 * 
 * @param color - The color value to sanitize
 * @param fallback - Fallback color if the input is invalid
 * @returns Valid hex color string
 */
export function sanitizeHexColor(color: unknown, fallback = '#ffffff'): string {
  if (isValidHexColor(color)) return color;
  return fallback;
}

/** 
 * HTML-encodes a string and truncates it.
 * 
 * @param input - The input string to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeInput(input: unknown, maxLength = 500): string {
  if (!input || typeof input !== 'string') return '';
  
  let sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
    
  sanitized = sanitized.trim();
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}

/**
 * Type guard to check if an unknown value is a record object (not null, not array).
 *
 * @param val - The value to check
 * @returns True if the value is a valid record object
 */
export function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}
