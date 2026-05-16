/**
 * Maximum allowed length for a FEN string before any parsing attempt.
 *
 * The longest practical 6-field FEN occurs when the piece-placement field
 * contains 64 pieces (no digits) + standard fields.
 * Total: 71 + (5 + 1 + 4 + 2 + 5 + 5) = 93 chars.
 */
export const MAX_FEN_LENGTH = 93;

/** Maximum size (bytes) allowed for a single localStorage entry value. */
export const MAX_STORAGE_ENTRY_BYTES = 512 * 1024;

/** Keys that would pollute the prototype chain. */
const PROTOTYPE_POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Prototype-pollution-safe JSON parser.
 * Drops keys that would pollute the prototype chain.
 *
 * @template T
 * @param {string | null | undefined} jsonString - Raw JSON string
 * @param {T} fallback - Fallback value on parse failure
 * @returns {T} Parsed object or fallback
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
 * @param {string | null | undefined} fileName
 * @returns {string} Safe filename
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
 * Clamps a numeric value to the given range or returns the default.
 */
export function validateNumber(value: unknown, min: number, max: number, defaultValue: number): number {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num) || !isFinite(num)) return defaultValue;
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

/** Returns clamped board size (4–100, default 8). */
export function validateBoardSize(size: unknown): number {
  return validateNumber(size, 4, 100, 8);
}

/** Returns clamped quality value (1–32, default 16). */
export function validateExportQuality(quality: unknown): number {
  return validateNumber(quality, 1, 32, 16);
}

/** Checks if color is a valid 6-digit hex string. */
export function isValidHexColor(color: unknown): color is string {
  if (!color || typeof color !== 'string') return false;
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/** Returns the color if it is a valid hex, otherwise returns the fallback. */
export function sanitizeHexColor(color: unknown, fallback = '#ffffff'): string {
  if (isValidHexColor(color)) return color;
  return fallback;
}

/** Validates the format of a full or partial FEN string. */
export function isValidFENFormat(fen: unknown): fen is string {
  if (!fen || typeof fen !== 'string') return false;
  if (fen.length > MAX_FEN_LENGTH) return false;
  
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 1 || parts.length > 6) return false;
  
  const position = parts[0];
  const ranks = position.split('/');
  if (ranks.length !== 8) return false;
  
  for (const rank of ranks) {
    let squareCount = 0;
    for (const char of rank) {
      if (/[1-8]/.test(char)) {
        squareCount += parseInt(char, 10);
      } else if (/[pnbrqkPNBRQK]/.test(char)) {
        squareCount += 1;
      } else {
        return false;
      }
    }
    if (squareCount !== 8) return false;
  }
  return true;
}

/** HTML-encodes a string and truncates it. */
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

/** Validates that a piece style exists. */
export function validatePieceStyle(style: unknown, validStyles: string[], defaultStyle = 'cburnett'): string {
  if (!style || typeof style !== 'string') return defaultStyle;
  const sanitized = sanitizeInput(style, 50);
  if (validStyles.includes(sanitized)) return sanitized;
  return defaultStyle;
}
