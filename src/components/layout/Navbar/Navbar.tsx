import { lazy, Suspense, memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Menu,
  Moon,
  Sun,
  X,
  UserCircle,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  User,
  Database
} from 'lucide-react';


import Logo from '@/assets/Logo.png';
import HelpCenter from '@/components/features/HelpCenter';
import { useNavbarState } from './useNavbarState';

/** Lazy-loaded: AuthModal is only rendered when the user opens it. */
const AuthModal = lazy(() =>
  import('@/features/auth/components/AuthModal').then((m) => ({
    default: m.AuthModal,
  })),
);

interface NavbarProps {
  /** The currently selected visual theme ('light' or 'dark') */
  theme: 'light' | 'dark';
  /** Action handler invoked to transition between themes */
  toggleTheme: (event?: React.SyntheticEvent | Event) => void;
  /** Optional slot for placing secondary layout items on the right side of the navbar */
  rightSlot?: React.ReactNode;
}

/**
 * Navbar component renders the application header containing brand logo,
 * responsive navigation controls, user authentication action points, theme toggling,
 * and standard workspace help center access.
 *
 * @param props - Custom layout and theme state properties
 * @returns Stylized fixed navigation header and modals
 */
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
    handleSignOut,
  } = useNavbarState();

  const renderThemeSubmenu = () => (
    <div className="flex flex-col">
      <button
        onClick={() => setOpenSubmenu(openSubmenu === 'theme' ? null : 'theme')}
        className="w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-text-secondary" />
          ) : (
            <Sun className="w-4 h-4 text-text-secondary" />
          )}
          <span>Theme</span>
        </div>
        {openSubmenu === 'theme' ? (
          <ChevronUp className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-secondary" />
        )}
      </button>

      {openSubmenu === 'theme' && (
        <div className="pl-8 pr-2 py-1 flex flex-col gap-1 border-l-2 border-surface-hover ml-3 mt-1 mb-1">
          <button
            onClick={(e) => {
              if (theme !== 'light') toggleTheme(e);
              setIsDropdownOpen(false);
            }}
            className={`text-left text-xs py-1.5 transition-colors ${
              theme === 'light'
                ? 'text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Light
          </button>
          <button
            onClick={(e) => {
              if (theme !== 'dark') toggleTheme(e);
              setIsDropdownOpen(false);
            }}
            className={`text-left text-xs py-1.5 transition-colors ${
              theme === 'dark'
                ? 'text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Dark
          </button>
        </div>
      )}
    </div>
  );

  const renderHelpButton = () => (
    <button
      onClick={handleHelpClick}
      className="w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
    >
      <HelpCircle className="w-4 h-4 text-text-secondary" />
      <span>Help</span>
    </button>
  );

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
              className="flex items-center gap-2 transition-colors duration-300 text-text-primary hover:text-accent"
            >
              <div className="flex items-center gap-2">
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-16 3xl:w-12 3xl:h-12 object-contain"
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

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-1.5">
              {rightSlot}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg transition-colors duration-200 ${
                    isDropdownOpen
                      ? 'bg-surface-elevated text-accent'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated'
                  }`}
                  aria-label="Account Menu"
                  aria-expanded={isDropdownOpen}
                >
                  <UserCircle className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-68 rounded-2xl border border-border/60 bg-surface p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="rounded-xl border border-border bg-surface-elevated p-3">
                      {!isAuthenticated ? (
                        /* ─── Guest Dropdown ──────────────────────── */
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => openAuthModal('signin')}
                            className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover mb-1"
                          >
                            <span className="block text-sm font-semibold text-text-primary">
                              Sign Up / Sign In
                            </span>
                            <span className="block text-xs text-text-secondary mt-0.5">
                              Sync boards and protect your workspace
                            </span>
                          </button>

                          <div className="h-px bg-border my-1" />

                          {renderThemeSubmenu()}
                          {renderHelpButton()}
                        </div>
                      ) : (
                        /* ─── Authenticated Dropdown ──────────────── */
                        <>
                          <div className="truncate mb-2 pb-2">
                            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">
                              SIGNED IN AS
                            </p>
                            <p
                              className="text-sm font-medium text-text-primary truncate"
                              title={session?.user?.email ?? ''}
                            >
                              {session?.user?.email}
                            </p>
                          </div>

                          <div className="h-px bg-border mb-2" />

                          <div className="flex flex-col gap-1">
                            <Link
                              to="/settings?tab=profile"
                              onClick={() => setIsDropdownOpen(false)}
                              className="w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
                            >
                              <User className="w-4 h-4 text-text-secondary" />
                              <span>Account Profile</span>
                            </Link>

                            <Link
                              to="/settings?tab=security"
                              onClick={() => setIsDropdownOpen(false)}
                              className="w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
                            >
                              <ShieldCheck className="w-4 h-4 text-text-secondary" />
                              <span>Security & Privacy</span>
                            </Link>

                            <Link
                              to="/settings?tab=data"
                              onClick={() => setIsDropdownOpen(false)}
                              className="w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
                            >
                              <Database className="w-4 h-4 text-text-secondary" />
                              <span>Data Management</span>
                            </Link>

                            <div className="h-px bg-border my-1" />
                            
                            {renderThemeSubmenu()}

                            <button
                              onClick={handleSignOut}
                              className="w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
                            >
                              <LogOut className="w-4 h-4 text-text-secondary" />
                              <span>Sign Out</span>
                            </button>

                            <div className="h-px bg-border my-1" />

                            {/* Help - bottom */}
                            {renderHelpButton()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Hamburger Button */}
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

        {/* Mobile Navigation Menu */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? 'max-h-125 border-b border-border/50 bg-surface'
              : 'max-h-0'
          }`}
        >
          <div className="px-4 py-3 space-y-2">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => openAuthModal('signin')}
                  className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-medium text-base">Sign In</span>
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="font-medium text-base">
                    Create Account
                  </span>
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-2 mb-2 bg-surface-hover rounded-lg">
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-0.5">
                    Signed in as
                  </p>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {session?.user?.email}
                  </p>
                </div>
                
                <Link
                  to="/settings?tab=profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium text-base">Account Profile</span>
                </Link>

                <Link
                  to="/settings?tab=security"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-medium text-base">Security & Privacy</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-error hover:bg-error/10 active:bg-error/20"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium text-base">Sign Out</span>
                </button>
              </>
            )}

            <div className="border-t border-border/50 my-2"></div>

            <button
              onClick={(e) => {
                toggleTheme(e);
                setIsMobileMenuOpen(false);
              }}
              className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              <span className="font-medium text-base">Toggle Theme</span>
            </button>
            <button
              onClick={handleHelpClick}
              className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium text-base">Help</span>
            </button>
          </div>
        </div>
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
