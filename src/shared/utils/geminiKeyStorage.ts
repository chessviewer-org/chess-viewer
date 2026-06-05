import { crypto } from './crypto';
import { logger } from './logger';

/**
 * Local, encrypted storage for the user's personal Gemini Vision API key.
 *
 * PRIVACY INVARIANT: the key lives ONLY in this browser. It is never synced to
 * Supabase or any server — there is intentionally no `syncStorage` path here.
 * The plaintext key is encrypted with AES-GCM (via {@link crypto}) before being
 * written to `localStorage`, mirroring the `enc:<ciphertext>` shape used by the
 * cloud E2EE path so a casual `localStorage` inspection never reveals the key.
 */

const STORAGE_KEY = 'cv_gemini_api_key';
const ENC_PREFIX = 'enc:';

/** Reuses the existing E2EE passphrase so we never introduce a second secret. */
const PRIVACY_KEY_STORAGE = 'cv_privacy_key';

/**
 * Resolves the device passphrase used to encrypt the Gemini key. Reuses the
 * existing `cv_privacy_key` when present (same secret syncStorage uses); if the
 * user has no privacy key yet, one is generated and persisted so the encrypted
 * value stays decryptable across reloads on this device.
 */
function getOrCreatePassphrase(): string {
  let passphrase = localStorage.getItem(PRIVACY_KEY_STORAGE);
  if (!passphrase) {
    const bytes = window.crypto.getRandomValues(new Uint8Array(32));
    passphrase = btoa(String.fromCharCode(...bytes));
    localStorage.setItem(PRIVACY_KEY_STORAGE, passphrase);
  }
  return passphrase;
}

/**
 * Encrypts and persists the Gemini API key in `localStorage`. The empty string
 * clears the stored key instead of writing an encrypted blank.
 *
 * @param key - Plaintext Gemini API key
 */
export async function saveGeminiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) {
    clearGeminiKey();
    return;
  }
  const ciphertext = await crypto.encrypt(trimmed, getOrCreatePassphrase());
  localStorage.setItem(STORAGE_KEY, `${ENC_PREFIX}${ciphertext}`);
}

/**
 * Decrypts and returns the stored Gemini API key, or an empty string when no
 * key is stored or decryption fails (e.g. the privacy key was cleared).
 *
 * @returns Plaintext key, or `''` when unavailable
 */
export async function loadGeminiKey(): Promise<string> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return '';
  if (!stored.startsWith(ENC_PREFIX)) {
    // Legacy/unexpected plaintext — treat as the key but do not trust the shape.
    return stored;
  }
  const passphrase = localStorage.getItem(PRIVACY_KEY_STORAGE);
  if (!passphrase) return '';
  try {
    return await crypto.decrypt(stored.slice(ENC_PREFIX.length), passphrase);
  } catch (error) {
    logger.error('Failed to decrypt Gemini key:', error);
    return '';
  }
}

/** Removes the stored Gemini key from `localStorage`. */
export function clearGeminiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Synchronously reports whether a key is stored. Used to gate the scan button
 * without paying the async decrypt cost on every render.
 *
 * @returns `true` when a key is present in `localStorage`
 */
export function hasGeminiKey(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}
