import { lazy, Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

import Logo from '@/assets/Logo.png';
import HelpCenter from '@/components/features/HelpCenter';
import { useNavbarState } from './useNavbarState';
import { NavbarDesktopDropdown } from './parts/NavbarDesktopDropdown';
import { NavbarMobileMenu } from './parts/NavbarMobileMenu';

const AuthModal = lazy(() =>
  import('@/features/auth/components/AuthModal').then((m) => ({
    default: m.AuthModal
  }))
);

/** Props for the `Navbar` shell component. */
interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: (event?: React.SyntheticEvent | Event) => void;
  rightSlot?: React.ReactNode;
}

function Navbar({ theme, toggleTheme, rightSlot }: NavbarProps) {
  const {
    isHelpOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    session,
    isAuthenticated,
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
    handleSignOut
  } = useNavbarState();

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-surface shadow-[0_10px_30px_-24px_rgba(0,0,0,0.45)]"
      >
        <div className="w-[88%] max-w-600 mx-auto">
          <div className="flex justify-between items-center h-16 sm:h-20 lg:h-24 3xl:h-24">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 transition-colors duration-200 text-text-primary hover:text-accent"
            >
              <div className="flex items-center gap-2">
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
                />
                <div>
                  <span className="font-display font-bold text-2xl sm:text-3xl leading-tight text-accent">
                    Chess
                  </span>
                  <span className="font-display font-bold text-2xl sm:text-3xl text-text-primary leading-tight ">
                    Vision
                  </span>
                </div>
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-1.5">
              {rightSlot}

              <NavbarDesktopDropdown
                theme={theme}
                toggleTheme={toggleTheme}
                isAuthenticated={isAuthenticated}
                session={session}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                openSubmenu={openSubmenu}
                setOpenSubmenu={setOpenSubmenu}
                dropdownRef={dropdownRef}
                openAuthModal={openAuthModal}
                handleSignOut={handleSignOut}
                handleHelpClick={handleHelpClick}
              />
            </div>

            <div className="flex sm:hidden items-center">
              <button
                onClick={toggleMobileMenu}
                className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        <NavbarMobileMenu
          isOpen={isMobileMenuOpen}
          theme={theme}
          toggleTheme={toggleTheme}
          isAuthenticated={isAuthenticated}
          session={session}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          openAuthModal={openAuthModal}
          handleSignOut={handleSignOut}
          handleHelpClick={handleHelpClick}
        />
      </motion.nav>

      <HelpCenter isOpen={isHelpOpen} onClose={handleCloseHelp} />
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialTab={authModalTab}
          />
        </Suspense>
      )}
    </>
  );
}

export default memo(Navbar);
