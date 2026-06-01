/**
 * Maximum allowed length for a FEN string before any parsing attempt.
 *
 * The longest practical 6-field FEN (for this app) occurs when the
 * piece-placement field contains 64 pieces (no digits):
 * - 64 piece letters + 7 '/' separators = 71 chars
 *
 * Then we allow standard fields with bounded numeric widths:
 * - 5 spaces
 * - active color: 1
 * - castling rights: up to 4 (KQkq)
 * - en-passant: up to 2 (e3)
 * - halfmove: up to 5 digits
 * - fullmove: up to 5 digits
 *
 * Total: 71 + (5 + 1 + 4 + 2 + 5 + 5) = 93 chars.
 *
 * @type {number}
 */
export const MAX_FEN_LENGTH = 93;

/** @type {ReadonlySet<string>} Keys that would pollute the prototype chain. */
const PROTOTYPE_POISON_KEYS = new Set([
  '__proto__',
  'constructor',
  'prototype'
]);

/**
 * Prototype-pollution-safe JSON parser.
 *
 * Uses a JSON.parse reviver to drop keys that would pollute the prototype
 * chain, then returns the parsed value or the provided fallback.
 *
 * @template T
 * @param {string} jsonString - Raw JSON string from an untrusted source
 * @param {T} [fallback=null] - Value returned when parsing fails or input is invalid
 * @returns {T|null}
 */
export function safeJSONParse(jsonString, fallback = null) {
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
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readLocalStorageItem(key) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  return window.localStorage.getItem(key);
}

/**
 * Reads and parses a localStorage value through the prototype-safe parser.
 *
 * @template T
 * @param {string} key - localStorage key
 * @param {T} [fallback=null] - Value returned when the key is missing or blocked
 * @returns {T|unknown}
 */
export function getStoredValue(key, fallback = null) {
  try {
    const raw = readLocalStorageItem(key);
    if (raw === null) {
      return fallback;
    }
    return safeJSONParse(raw, fallback);
  } catch {
    return fallback;
  }
}

/**
 * Reads a string setting from localStorage.
 *
 * Legacy entries in this app sometimes store bare strings such as `dark` or
 * `#f0d9b5`; those are returned as strings after the safe JSON parse fails.
 *
 * @param {string} key - localStorage key
 * @param {string} fallback - Value returned on missing, invalid, or blocked reads
 * @returns {string}
 */
export function getStoredString(key, fallback) {
  try {
    const raw = readLocalStorageItem(key);
    if (raw === null) {
      return fallback;
    }
    const parsed = safeJSONParse(raw, undefined);
    if (typeof parsed === 'string') {
      return parsed;
    }
    return parsed === undefined ? raw : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Reads a boolean setting from localStorage.
 *
 * @param {string} key - localStorage key
 * @param {boolean} fallback - Value returned on missing, invalid, or blocked reads
 * @returns {boolean}
 */
export function getStoredBoolean(key, fallback) {
  const value = getStoredValue(key, fallback);
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Reads a localStorage entry for backup export, preserving legacy bare strings.
 *
 * @param {string} key - localStorage key
 * @returns {unknown|null}
 */
export function getStoredBackupValue(key) {
  try {
    const raw = readLocalStorageItem(key);
    if (raw === null) {
      return null;
    }
    const parsed = safeJSONParse(raw, undefined);
    return parsed === undefined ? raw : parsed;
  } catch {
    return null;
  }
}

/**
 * Strips unsafe filename characters and enforces a max length of 100.
 *
 * @param {string} fileName
 * @returns {string} Safe filename (falls back to 'chess-position')
 */
export function sanitizeFileName(fileName) {
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
  if (!sanitized || sanitized.length === 0) {
    return 'chess-position';
  }
  return sanitized;
}
/**
 * @param {*} color
 * @returns {boolean} True if color is a valid 6-digit hex string
 */
function isValidHexColor(color) {
  if (!color || typeof color !== 'string') {
    return false;
  }
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  return hexPattern.test(color);
}
/**
 * Returns the color if it is a valid hex, otherwise returns the fallback.
 *
 * @param {string} color
 * @param {string} [fallback='#ffffff']
 * @returns {string}
 */
export function sanitizeHexColor(color, fallback = '#ffffff') {
  if (isValidHexColor(color)) {
    return color;
  }
  return fallback;
}
/**
 * HTML-encodes a string and truncates it to maxLength.
 *
 * @param {string} input
 * @param {number} [maxLength=500]
 * @returns {string}
 */
export function sanitizeInput(input, maxLength = 500) {
  if (!input || typeof input !== 'string') {
    return '';
  }
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
