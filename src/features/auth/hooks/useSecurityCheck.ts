import { useCallback, useEffect, useState } from 'react';

import type { User } from '@supabase/supabase-js';

import { supabase } from '@/features/auth/services/supabaseClient';

import { logger } from '@utils/logger';

/** Shape of a `user_security` row (only the field we query). */
interface SecurityRow {
  last_verified_at: string;
}

/**
 * 90-day re-verification hook.
 * Only activates for authenticated users — guests always get `isLocked: false`.
 * Fail-close: Defaults to locked, only unlocks on positive server confirmation.
 */
export function useSecurityCheck() {
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function checkSecurity(user: User | null) {
      if (signal.aborted) return;
      if (!user) {
        if (!signal.aborted) {
          setIsLocked(false);
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('user_security')
        .select('last_verified_at')
        .eq('user_id', user.id)
        .maybeSingle<SecurityRow>();

      if (signal.aborted) return;

      if (error || !data) {
        if (error && (error.code === 'PGRST116' || error.code === 'PGRST204')) {
          logger.warn('Supabase sync: user_security row is missing.');
        }
        setIsLocked(true);
        setIsLoading(false);
        return;
      }

      const raw = data.last_verified_at;
      if (typeof raw !== 'string' || raw.trim() === '') {
        setIsLocked(true);
        setIsLoading(false);
        return;
      }
      const lastVerified = new Date(raw).getTime();
      if (!Number.isFinite(lastVerified)) {
        setIsLocked(true);
        setIsLoading(false);
        return;
      }
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;

      setIsLocked(Date.now() - lastVerified > ninetyDays);
      setIsLoading(false);
    }

    // Use getSession() (local, synchronous read from storage) rather than
    // getUser() (network round-trip) to decide whether a user exists. Guests
    // then resolve instantly with no network call, so the app never blocks on
    // Supabase at boot. The 90-day server check still runs for real sessions.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        checkSecurity(session?.user ?? null);
      })
      .catch((err: unknown) => {
        if (!signal.aborted)
          logger.warn('useSecurityCheck: getSession failed', err);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      checkSecurity(session?.user ?? null);
    });

    return () => {
      controller.abort();
      data?.subscription.unsubscribe();
    };
  }, []);

  const unlock = useCallback(async () => {
    try {
      const { data, error: getUserError } = await supabase.auth.getUser();
      if (getUserError || !data?.user) {
        logger.warn('useSecurityCheck: unlock aborted, no authenticated user');
        return;
      }

      const { error } = await supabase.rpc('refresh_security_session');
      if (error) {
        logger.warn('useSecurityCheck: refresh_security_session failed', error);
        return;
      }
      setIsLocked(false);
    } catch (err) {
      // getUser/rpc reject on network failure — stay fail-closed (locked).
      logger.warn('useSecurityCheck: unlock failed', err);
    }
  }, []);

  return { isLocked, isLoading, unlock };
}
