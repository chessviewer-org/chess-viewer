import { memo } from 'react';

import { UserCircle, X } from '@/assets/icons';

import { Logo } from '@/shared/ui';
import { NavbarDesktopMenu, NavbarMobileMenu } from './NavbarMenu';
interface NavbarProps {
  rightSlot?: React.ReactNode;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  isDesktopDropdownOpen: boolean;
  setIsDesktopDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  handleLogoClick: () => void;
  toggleMobileMenu: () => void;
  handleSignOut: () => void;
}

function Navbar({
  rightSlot,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isAuthenticated,
  isDesktopDropdownOpen,
  setIsDesktopDropdownOpen,
  dropdownRef,
  handleLogoClick,
  toggleMobileMenu,
  handleSignOut
}: NavbarProps) {
  const toggleButtonClass = (isOpen: boolean) =>
    `p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      isOpen
        ? 'bg-surface-elevated text-accent'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pt-[max(0px, env(safe-area-inset-top))] transition-all duration-300 animate-navbar-in">
      <div className="relative z-50 bg-surface">
        <div className="page-container">
          <div className="flex justify-between items-center py-3 min-h-12 sm:min-h-14 lg:min-h-16">
            <button
              type="button"
              onClick={handleLogoClick}
              aria-label="ChessViewer home"
              className="flex items-center gap-2 rounded-lg transition-colors duration-200 text-text-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-center gap-2">
                <Logo className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain" />
                <div className="hidden lg:block">
                  <span className="font-display font-bold text-xl xs:text-2xl sm:text-3xl leading-tight text-text-primary">
                    ChessViewer
                  </span>
                </div>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-2">
              {rightSlot}
              <NavbarDesktopMenu
                isAuthenticated={isAuthenticated}
                isDesktopDropdownOpen={isDesktopDropdownOpen}
                setIsDesktopDropdownOpen={setIsDesktopDropdownOpen}
                dropdownRef={dropdownRef}
                handleSignOut={handleSignOut}
              />
            </div>

            <div className="flex lg:hidden items-center gap-2">
              {rightSlot}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className={toggleButtonClass(isMobileMenuOpen)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <UserCircle className="w-6 h-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <NavbarMobileMenu
        isOpen={isMobileMenuOpen}
        isAuthenticated={isAuthenticated}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleSignOut={handleSignOut}
      />
    </nav>
  );
}

export default memo(Navbar);
