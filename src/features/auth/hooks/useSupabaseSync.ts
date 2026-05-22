import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

import { supabase } from '../services/supabaseClient';
import { logger } from '@/utils/logger';

declare global {
  interface Window {
    storage?: {
      get: (key: string) => Promise<{ value: string } | null>;
      set: (key: string, value: string) => Promise<void>;
      delete: (key: string) => Promise<void>;
    };
  }
}

/** Shape of a `user_data` row (only the field we read). */
interface UserDataValueRow {
  value: string;
}

/**
 * Background sync hook.
 * Attaches a `window.storage` API for authenticated users.
 * No-ops gracefully for guests.
 */
export function useSupabaseSync() {
  useEffect(() => {
    const setupSync = (user: User | null): void => {
      if (!user) {
        delete window.storage;
        return;
      }

      window.storage = {
        get: async (key: string) => {
          try {
            const { data, error } = await supabase
              .from('user_data')
              .select('value')
              .eq('user_id', user.id)
              .eq('key', key)
              .single<UserDataValueRow>();
              
            if (error) {
              if (error.code === 'PGRST116') return null; // Not found
              throw error;
            }
            return { value: data?.value ?? '' };
          } catch (error: unknown) {
            logger.error('Supabase sync get error:', error);
            return null;
          }
        },
        set: async (key: string, value: string) => {
          try {
            const { error } = await supabase
              .from('user_data')
              .upsert(
                { user_id: user.id, key, value, updated_at: new Date().toISOString() },
                { onConflict: 'user_id,key' },
              );
              
            if (error) throw error;
          } catch (error: unknown) {
            logger.error('Supabase sync set error:', error);
          }
        },
        delete: async (key: string) => {
          try {
            const { error } = await supabase
              .from('user_data')
              .delete()
              .eq('user_id', user.id)
              .eq('key', key);
              
            if (error) throw error;
          } catch (error: unknown) {
            logger.error('Supabase sync delete error:', error);
          }
        },
      };
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      setupSync(user);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setupSync(session?.user ?? null);
    });

    return () => {
      data?.subscription.unsubscribe();
    };
  }, []);
}
