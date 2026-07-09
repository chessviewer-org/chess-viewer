import { useLocation } from 'wouter';
import { useCallback, useRef, useState } from 'react';

import { useAuth } from '@/auth';
import { useOutsideClick } from '@hooks';

// Constants
const AUTH_ROUTE: Record<'signin' | 'signup' | 'security', string> = {
  signin: '/auth/sign-in',
  signup: '/auth/sign-up',
  security: '/settings?tab=security'
};

export function useNavbarState() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);

  const { session, isAuthenticated, signOut } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);

  const [, navigate] = useLocation();

  useOutsideClick(
    dropdownRef,
    () => setIsDesktopDropdownOpen(false),
    isDesktopDropdownOpen
  );

  const handleLogoClick = useCallback(() => {
    navigate('/');
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
    setIsDesktopDropdownOpen(false);
  }, []);

  const openAuthModal = useCallback(
    (tab: 'signin' | 'signup' | 'security') => {
      setIsDesktopDropdownOpen(false);
      setIsMobileMenuOpen(false);
      navigate(AUTH_ROUTE[tab]);
    },
    [navigate]
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    setIsDesktopDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [signOut]);

  return {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    session,
    isAuthenticated,
    signOut,
    isDesktopDropdownOpen,
    setIsDesktopDropdownOpen,
    dropdownRef,
    handleLogoClick,
    toggleMobileMenu,
    openAuthModal,
    handleSignOut
  };
}
