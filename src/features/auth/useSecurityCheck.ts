import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useSecurityCheck() {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkSecurity() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('user_security')
        .select('last_verified_at')
        .eq('user_id', user.id)
        .single();
        
      if (error || !data) {
        setIsLoading(false);
        return;
      }

      const lastVerified = new Date(data.last_verified_at).getTime();
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      
      if (Date.now() - lastVerified > ninetyDays) {
        setIsLocked(true);
      }
      
      setIsLoading(false);
    }
    
    checkSecurity();
  }, []);

  const unlock = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_security')
        .update({ last_verified_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }
    setIsLocked(false);
  };

  return { isLocked, isLoading, unlock };
}
