import { memo } from 'react';

import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

import { Logo } from '@/components/layout/Logo';

import { NavbarDesktopDropdown } from './parts/NavbarDesktopDropdown';
import { NavbarMobileMenu } from './parts/NavbarMobileMenu';

/** Props for the `Navbar` shell component. */
interface NavbarProps {
  rightSlot?: React.ReactNode;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  isDropdownOpen: boolean;
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  handleLogoClick: () => void;
  toggleMobileMenu: () => void;
  openAuthModal: (tab: 'signin' | 'signup' | 'security') => void;
  handleSignOut: () => void;
}

function Navbar({
  rightSlot,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isAuthenticated,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownRef,
  handleLogoClick,
  toggleMobileMenu,
  openAuthModal,
  handleSignOut
}: NavbarProps) {
  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="navbar-shell fixed top-0 left-0 right-0 z-50"
      >
        <div className="page-container">
          <div className="flex justify-between items-center py-3 min-h-12 sm:min-h-14 lg:min-h-16">
            <button
              type="button"
              onClick={handleLogoClick}
              aria-label="ChessVision home"
              className="flex items-center gap-2 rounded-lg transition-colors duration-200 text-text-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-2">
                <Logo className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain" />
                <div>
                  <span className="font-display font-bold text-xl xs:text-2xl sm:text-3xl leading-tight text-accent">
                    Chess
                  </span>
                  <span className="font-display font-bold text-xl xs:text-2xl sm:text-3xl text-text-primary leading-tight ">
                    Vision
                  </span>
                </div>
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-1.5">
              {rightSlot}

              <NavbarDesktopDropdown
                isAuthenticated={isAuthenticated}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                dropdownRef={dropdownRef}
                openAuthModal={openAuthModal}
                handleSignOut={handleSignOut}
              />
            </div>

            <div className="flex sm:hidden items-center">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-menu"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        <NavbarMobileMenu
          isOpen={isMobileMenuOpen}
          isAuthenticated={isAuthenticated}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          openAuthModal={openAuthModal}
          handleSignOut={handleSignOut}
        />
      </motion.nav>
    </>
  );
}

export default memo(Navbar);
