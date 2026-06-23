import { useCallback, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOutsideClick } from '@hooks';

/** Maps an auth intent to its dedicated route. The `security` tab now lives on
 *  the settings page rather than a modal, so it routes there. */
const AUTH_ROUTE: Record<'signin' | 'signup' | 'security', string> = {
  signin: '/auth/sign-in',
  signup: '/auth/sign-up',
  security: '/settings?tab=security'
};

/**
 * Manages all internal navbar state: mobile menu, dropdown, click-outside
 * closure, sign-out, and navigation to the dedicated auth pages.
 *
 * @returns State variables, refs, and event handlers for the `Navbar` component.
 */
export function useNavbarState() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { session, isAuthenticated, signOut } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  useOutsideClick(dropdownRef, () => setIsDropdownOpen(false), isDropdownOpen);

  const handleLogoClick = useCallback(() => {
    navigate('/');
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
    setIsDropdownOpen(false);
  }, []);

  /** Navigates to the dedicated auth page for the given intent. Kept under the
   *  `openAuthModal` name so existing `ModalContext` consumers stay compatible. */
  const openAuthModal = useCallback(
    (tab: 'signin' | 'signup' | 'security') => {
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
      navigate(AUTH_ROUTE[tab]);
    },
    [navigate]
  );

  const handleSignOut = useCallback(async () => {
    await signOut();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [signOut]);

  return {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    session,
    isAuthenticated,
    signOut,
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    handleLogoClick,
    toggleMobileMenu,
    openAuthModal,
    handleSignOut
  };
}
