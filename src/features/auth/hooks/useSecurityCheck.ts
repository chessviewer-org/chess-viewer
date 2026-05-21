import { useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';

import { supabase } from '../services/supabaseClient';

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
    async function checkSecurity(user: User | null) {
      if (!user) {
        setIsLocked(false);
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('user_security')
        .select('last_verified_at')
        .eq('user_id', user.id)
        .maybeSingle<SecurityRow>();
        
      if (error || !data) {
        // Use error code since PostgrestError might not have status property in this version
        if (error && (error.code === 'PGRST116' || error.code === 'PGRST204')) {
          console.warn('Supabase sync: user_security row is missing.');
        }
        setIsLocked(true);
        setIsLoading(false);
        return;
      }

      const lastVerified = new Date(data.last_verified_at).getTime();
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      
      if (Date.now() - lastVerified > ninetyDays) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
      
      setIsLoading(false);
    }
    
    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      checkSecurity(user);
    });

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      checkSecurity(session?.user ?? null);
    });
    
    return () => {
      data?.subscription.unsubscribe();
    };
  }, []);

  const unlock = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Use RPC instead of direct update to bypass disabled UPDATE policy
      const { error } = await supabase.rpc('refresh_security_session');
        
      if (!error) {
        setIsLocked(false);
      }
    }
  }, []);

  return { isLocked, isLoading, unlock };
}
