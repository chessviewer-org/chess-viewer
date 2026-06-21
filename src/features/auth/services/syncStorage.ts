import type { User } from '@supabase/supabase-js';

import { logger } from '@utils/logger';
import { supabase } from './supabaseClient';

interface UserDataValueRow {
  value: string;
}

/**
 * Outcome of a `syncStorage.set`.
 *  - `'ok'`        — written to the cloud.
 *  - `'too-large'` — exceeded the server cap; cloud write skipped (local intact).
 *  - `'skipped'`   — no authenticated user.
 *  - `'error'`     — an unexpected failure.
 */
export type SyncSetResult = 'ok' | 'too-large' | 'skipped' | 'error';

const isTableMissingError = (err: unknown): boolean =>
  !!err &&
  typeof err === 'object' &&
  'code' in err &&
  (err as { code: string }).code === '42P01';

/** Hard cap mirroring the `user_data.value` CHECK constraint (schema.sql). */
const MAX_USER_DATA_VALUE_LENGTH = 10_000;

/**
 * Conservative budget callers trim unbounded payloads (history, archive) to so
 * they comfortably fit under {@link MAX_USER_DATA_VALUE_LENGTH}.
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
} else if (typeof window !== 'undefined') {
  // Production has no HMR dispose hook: release the auth subscription on page
  // teardown so it doesn't outlive the document during navigation/unload.
  window.addEventListener('pagehide', () => {
    authSubscription?.unsubscribe();
    authSubscription = null;
  });
}

/**
 * Key-value store backed by the `user_data` Supabase table. Access is owner-
 * scoped by RLS (each user reads/writes only their own rows). No-ops when there
 * is no authenticated session — the local copy is the source of truth and cloud
 * sync is best-effort.
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

      return { value: data.value };
    } catch (error: unknown) {
      logger.error('Supabase sync get error:', error);
      return null;
    }
  },

  set: async (key: string, value: string): Promise<SyncSetResult> => {
    if (!currentUser) return 'skipped';
    try {
      if (value.length > MAX_USER_DATA_VALUE_LENGTH) {
        logger.warn('syncStorage.set rejected: value exceeds server cap', {
          key,
          length: value.length
        });
        return 'too-large';
      }

      const { error } = await supabase.from('user_data').upsert(
        {
          user_id: currentUser.id,
          key,
          value,
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
