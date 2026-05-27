import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOutsideClick } from '@hooks/useOutsideClick';

/**
 * Manages all internal navbar state: help drawer, mobile menu, auth modal,
 * dropdown, submenus, click-outside closure, and sign-out.
 *
 * @returns State variables, refs, and event handlers for the `Navbar` component.
 */
export function useNavbarState() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { session, isAuthenticated, signOut } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'security'>('signin');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<'settings' | 'theme' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  useOutsideClick(dropdownRef, () => setIsDropdownOpen(false), isDropdownOpen);

  const handleLogoClick = useCallback(() => {
    navigate('/');
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const handleHelpClick = useCallback(() => {
    setIsHelpOpen(true);
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, []);

  const handleCloseHelp = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
    setIsDropdownOpen(false);
  }, []);

  const openAuthModal = useCallback((tab: 'signin' | 'signup' | 'security') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [signOut]);

  return {
    isHelpOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    session,
    isAuthenticated,
    signOut,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    isDropdownOpen,
    setIsDropdownOpen,
    openSubmenu,
    setOpenSubmenu,
    dropdownRef,
    handleLogoClick,
    handleHelpClick,
    handleCloseHelp,
    toggleMobileMenu,
    openAuthModal,
    handleSignOut,
  };
}
