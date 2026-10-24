import { useLocation } from 'wouter';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useAuth } from '@/auth/core/useAuth';

export function useNavbarState() {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { isAuthenticated, signOut } = useAuth();
  const accountRef = useRef<HTMLDivElement>(null);
  const [location, navigate] = useLocation();

  useLayoutEffect(() => setIsAccountOpen(false), [location]);

  const handleLogoClick = useCallback(() => {
    setIsAccountOpen(false);
    navigate('/');
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
    setIsAccountOpen(false);
    await signOut();
  }, [signOut]);

  return {
    isAccountOpen,
    setIsAccountOpen,
    isAuthenticated,
    accountRef,
    handleLogoClick,
    handleSignOut
  };
}
