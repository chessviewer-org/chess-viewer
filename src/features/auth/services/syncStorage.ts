import type { User } from '@supabase/supabase-js';

import { supabase } from './supabaseClient';
import { logger } from '@utils/logger';
import { crypto } from '@utils/crypto';

const ENCRYPTION_KEY_STORAGE = 'cv_privacy_key';

interface UserDataValueRow {
  value: string;
}

const isTableMissingError = (err: unknown) => err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '42P01';

const MAX_USER_DATA_VALUE_LENGTH = 10_000;

let currentUser: User | null = null;

supabase.auth.getUser().then(({ data: { user } }) => {
  currentUser = user;
});

supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
});

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
      
      if (!data || typeof data.value !== 'string' || data.value === '') return null;

      const encryptionKey = getEncryptionKey();
      if (encryptionKey && data.value.startsWith('enc:')) {
        try {
          const decrypted = await crypto.decrypt(data.value.replace('enc:', ''), encryptionKey);
          if (typeof decrypted !== 'string') return null;
          return { value: decrypted };
        } catch (decErr) {
          logger.warn('Failed to decrypt cloud data. Returning raw value.', decErr);
          return { value: data.value };
        }
      }

      return { value: data.value };
    } catch (error: unknown) {
      logger.error('Supabase sync get error:', error);
      return null;
    }
  },
  
  set: async (key: string, value: string): Promise<void> => {
    if (!currentUser) return;
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
          length: valueToStore.length,
        });
        return;
      }

      const { error } = await supabase
        .from('user_data')
        .upsert(
          { user_id: currentUser.id, key, value: valueToStore, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,key' },
        );
        
      if (error) {
        if (isTableMissingError(error)) return;
        throw error;
      }
    } catch (error: unknown) {
      logger.error('Supabase sync set error:', error);
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
  },
};
