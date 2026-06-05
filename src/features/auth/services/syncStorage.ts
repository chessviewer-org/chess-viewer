import type { User } from '@supabase/supabase-js';

import { crypto } from '@utils/crypto';
import { logger } from '@utils/logger';
import { supabase } from './supabaseClient';

const ENCRYPTION_KEY_STORAGE = 'cv_privacy_key';

interface UserDataValueRow {
  value: string;
}

/**
 * Outcome of a `syncStorage.set`. Callers that persist unbounded data (history,
 * archive) inspect this to decide whether to trim + warn the user; fire-and-
 * forget callers may ignore it. `'too-large'` means the cloud write was skipped
 * (local copy is unaffected); `'skipped'` means there was no authenticated user.
 */
export type SyncSetResult = 'ok' | 'too-large' | 'skipped' | 'error';

const isTableMissingError = (err: unknown) =>
  err &&
  typeof err === 'object' &&
  'code' in err &&
  (err as { code: string }).code === '42P01';

/**
 * Hard cap mirroring the `user_data.value` CHECK constraint (schema.sql). The
 * E2EE path stores `enc:<ciphertext>`, which is ~33% larger than the plaintext,
 * so callers sizing a payload to fit should budget against the SAFE estimate
 * below, not this raw cap.
 */
export const MAX_USER_DATA_VALUE_LENGTH = 10_000;

/**
 * Conservative plaintext budget that still fits once E2EE-encoded. Base64 of
 * AES-GCM ciphertext is ~1.37× the input plus the `enc:` prefix and IV; 7_000
 * leaves comfortable headroom under the 10_000 cap. Callers trimming history to
 * fit should target this, not MAX_USER_DATA_VALUE_LENGTH.
 */
export const SAFE_SYNC_PLAINTEXT_BUDGET = 7_000;

let currentUser: User | null = null;

// Module-scoped auth subscription. Idempotent so HMR re-evaluation / StrictMode
// double-invoke can't stack uncleaned listeners (MaxListenersExceededWarning).
let authSubscription: { unsubscribe: () => void } | null = null;

function subscribeToAuth(): void {
  authSubscription?.unsubscribe();
  // onAuthStateChange fires synchronously on subscribe, covering the initial
  // value — avoids a getUser() race that could clobber currentUser when stale.
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
  });
  authSubscription = data.subscription;
}

subscribeToAuth();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    authSubscription?.unsubscribe();
    authSubscription = null;
  });
}

/**
 * Retrieves the E2EE encryption key from localStorage.
 *
 * @returns The passphrase used for AES-GCM encryption, or `null` if E2EE is not configured
 */
function getEncryptionKey(): string | null {
  return localStorage.getItem(ENCRYPTION_KEY_STORAGE);
}

/**
 * Key-value store backed by the `user_data` Supabase table with transparent E2EE.
 *
 * Values are encrypted with AES-GCM before upload when a `cv_privacy_key` is present in
 * `localStorage`. Falls back to a no-op when no authenticated user session is active.
 */
export const syncStorage = {
  get: async (key: string): Promise<{ value: string } | null> => {
    if (!currentUser) return null;
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('value')
        .eq('user_id', currentUser.id)
        .eq('key', key)
        .maybeSingle<UserDataValueRow>();

      if (error) {
        if (isTableMissingError(error)) return null;
        throw error;
      }

      if (!data || typeof data.value !== 'string' || data.value === '')
        return null;

      const encryptionKey = getEncryptionKey();
      if (encryptionKey && data.value.startsWith('enc:')) {
        try {
          const decrypted = await crypto.decrypt(
            data.value.replace('enc:', ''),
            encryptionKey
          );
          if (typeof decrypted !== 'string') return null;
          return { value: decrypted };
        } catch (decErr) {
          logger.warn(
            'Failed to decrypt cloud data. Returning raw value.',
            decErr
          );
          return { value: data.value };
        }
      }

      return { value: data.value };
    } catch (error: unknown) {
      logger.error('Supabase sync get error:', error);
      return null;
    }
  },

  set: async (key: string, value: string): Promise<SyncSetResult> => {
    if (!currentUser) return 'skipped';
    try {
      let valueToStore = value;
      const encryptionKey = getEncryptionKey();

      if (encryptionKey) {
        const encrypted = await crypto.encrypt(value, encryptionKey);
        valueToStore = `enc:${encrypted}`;
      }

      if (valueToStore.length > MAX_USER_DATA_VALUE_LENGTH) {
        logger.warn('syncStorage.set rejected: value exceeds server cap', {
          key,
          length: valueToStore.length
        });
        return 'too-large';
      }

      const { error } = await supabase.from('user_data').upsert(
        {
          user_id: currentUser.id,
          key,
          value: valueToStore,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,key' }
      );

      if (error) {
        if (isTableMissingError(error)) return 'skipped';
        throw error;
      }
      return 'ok';
    } catch (error: unknown) {
      logger.error('Supabase sync set error:', error);
      return 'error';
    }
  },

  delete: async (key: string): Promise<void> => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('key', key);

      if (error) {
        if (isTableMissingError(error)) return;
        throw error;
      }
    } catch (error: unknown) {
      logger.error('Supabase sync delete error:', error);
    }
  }
};
