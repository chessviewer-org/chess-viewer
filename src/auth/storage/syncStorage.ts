import { logger } from '@utils/logger';
import { supabase } from '../core/Supabase';

// Types
export type SyncSetResult = 'ok' | 'too-large' | 'skipped' | 'error';

// Constants
export const SAFE_SYNC_PLAINTEXT_BUDGET = 7_000;

const MAX_VALUE_LENGTH = 10_000;
const TABLE_MISSING_ERROR = '42P01';

// Helpers
async function getUserId(): Promise<string | null> {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

function isTableMissing(code: string | undefined): boolean {
  return code === TABLE_MISSING_ERROR;
}

// Service
const pendingReads = new Map<string, Promise<{ value: string } | null>>();

export const syncStorage = {
  async get(key: string): Promise<{ value: string } | null> {
    const userId = await getUserId();
    if (!userId) return null;

    const requestKey = JSON.stringify([userId, key]);
    const pending = pendingReads.get(requestKey);
    if (pending) return pending;

    const request = (async () => {
      try {
        const { data, error } = await supabase
          .from('user_data')
          .select('value')
          .eq('user_id', userId)
          .eq('key', key)
          .returns<{ value: string }>()
          .maybeSingle();

        if (error && !isTableMissing(error.code)) {
          logger.error(`syncStorage.get failed for key "${key}":`, error);
          return null;
        }

        return data?.value ? { value: data.value } : null;
      } catch (err) {
        logger.error(`syncStorage.get caught error for key "${key}":`, err);
        return null;
      }
    })().finally(() => {
      // Entries live only for the request, so later visits still read fresh data.
      if (pendingReads.get(requestKey) === request)
        pendingReads.delete(requestKey);
    });
    pendingReads.set(requestKey, request);
    return request;
  },

  async set(key: string, value: string): Promise<SyncSetResult> {
    const userId = await getUserId();
    if (!userId) return 'skipped';
    pendingReads.delete(JSON.stringify([userId, key]));

    if (value.length > MAX_VALUE_LENGTH) return 'too-large';

    try {
      const { error } = await supabase.from('user_data').upsert(
        {
          user_id: userId,
          key,
          value,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,key' }
      );

      if (error) {
        if (isTableMissing(error.code)) return 'skipped';
        logger.error(`syncStorage.set failed for key "${key}":`, error);
        return 'error';
      }

      return 'ok';
    } catch (err) {
      logger.error(`syncStorage.set caught error for key "${key}":`, err);
      return 'error';
    }
  },

  async delete(key: string): Promise<void> {
    const userId = await getUserId();
    if (!userId) return;
    pendingReads.delete(JSON.stringify([userId, key]));

    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', userId)
        .eq('key', key);

      if (error && !isTableMissing(error.code)) {
        logger.error(`syncStorage.delete failed for key "${key}":`, error);
      }
    } catch (err) {
      logger.error(`syncStorage.delete caught error for key "${key}":`, err);
    }
  }
};
