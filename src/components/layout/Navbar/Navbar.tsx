import { memo } from 'react';

import { UserCircle, X } from '@/assets/icons';

import { Logo } from '@/shared/ui';
import { NavbarDesktopMenu, NavbarMobileMenu } from './NavbarMenu';
import styles from './styles/navbar.module.scss';
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
    `${styles['toggleBtn']} ${
      isOpen ? styles['toggleBtnOpen'] : styles['toggleBtnClosed']
    }`;

  return (
    <nav className={styles['nav']}>
      <div className={styles['navInner']}>
        <div className="page-container">
          <div className={styles['navContainer']}>
            <button
              type="button"
              onClick={handleLogoClick}
              aria-label="ChessViewer home"
              className={styles['logoBtn']}
            >
              <div className={styles['logoInner']}>
                <Logo className={styles['logoImg'] ?? ''} />
                <div className={styles['logoTextWrapper']}>
                  <span className={styles['logoText']}>ChessViewer</span>
                </div>
              </div>
            </button>

            <div className={styles['desktopMenuWrapper']}>
              {rightSlot}
              <NavbarDesktopMenu
                isAuthenticated={isAuthenticated}
                isDesktopDropdownOpen={isDesktopDropdownOpen}
                setIsDesktopDropdownOpen={setIsDesktopDropdownOpen}
                dropdownRef={dropdownRef}
                handleSignOut={handleSignOut}
              />
            </div>

            <div className={styles['mobileMenuWrapper']}>
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
                  <X className={styles['toggleIcon']} aria-hidden="true" />
                ) : (
                  <UserCircle
                    className={styles['toggleIcon']}
                    aria-hidden="true"
                  />
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
