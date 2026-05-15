import { memo, useCallback, useState, useEffect, useRef } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Logo from '@/assets/Logo.png';
import HelpCenter from '@/components/features/HelpCenter';
import { AuthModal } from '@/features/auth/AuthModal';
import { supabase } from '@/features/auth/supabaseClient';
import { useOutsideClick } from '@/hooks/useOutsideClick';

function Navbar({ theme, toggleTheme, rightSlot }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auth state
  const [session, setSession] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('signin');

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const openAuthModal = (tab) => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-surface-primary/85 shadow-[0_10px_30px_-24px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="w-[88%] max-w-[2400px] mx-auto">
          <div className="flex justify-between items-center h-[4rem] sm:h-[5rem] lg:h-[6rem] 3xl:h-[6rem]">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 transition-colors duration-300 text-text-primary hover:text-accent"
            >
              <div className="flex items-center gap-2">
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-[2rem] h-[2rem] sm:w-[2.5rem] sm:h-[2.5rem] lg:w-[3rem] lg:h-[4rem] 3xl:w-[3rem] 3xl:h-[3rem] object-contain"
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
                  className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors duration-200 ${isDropdownOpen ? 'bg-surface-elevated text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated'}`}
                  aria-label="Account Menu"
                  aria-expanded={isDropdownOpen}
                >
                  <UserCircle className="w-5 h-5" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-[17rem] rounded-2xl border border-border bg-surface-primary p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="rounded-xl border border-border bg-surface-elevated p-3">
                      {!session ? (
                        <button
                          onClick={() => openAuthModal('signin')}
                          className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
                        >
                          <span className="block text-sm font-semibold text-text-primary">
                            Sign Up / Sign In
                          </span>
                          <span className="block text-xs text-text-secondary mt-0.5">
                            Sync boards and protect your workspace
                          </span>
                        </button>
                      ) : (
                        <>
                          <div className="truncate">
                            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mb-1">
                              Signed in as
                            </p>
                            <p
                              className="text-sm font-medium text-text-primary truncate"
                              title={session.user.email}
                            >
                              {session.user.email}
                            </p>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => openAuthModal('security')}
                              className="flex-1 rounded-lg px-2 py-2 text-xs font-semibold text-text-primary bg-surface-hover hover:bg-surface-primary transition-colors flex items-center justify-center gap-1.5"
                            >
                              <ShieldCheck className="w-4 h-4 text-text-secondary" />
                              Security
                            </button>
                            <button
                              onClick={handleSignOut}
                              className="flex-1 rounded-lg px-2 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="my-3 h-px bg-border" />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => {
                          toggleTheme(e);
                          setIsDropdownOpen(false);
                        }}
                        className="rounded-lg px-3 py-2.5 bg-surface-elevated text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
                      >
                        {theme === 'dark' ? (
                          <Sun className="w-4 h-4 text-text-secondary" />
                        ) : (
                          <Moon className="w-4 h-4 text-text-secondary" />
                        )}
                        <span className="text-sm font-medium">
                          {theme === 'dark' ? 'Light' : 'Dark'}
                        </span>
                      </button>
                      <button
                        onClick={handleHelpClick}
                        className="rounded-lg px-3 py-2.5 bg-surface-elevated text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
                      >
                        <HelpCircle className="w-4 h-4 text-text-secondary" />
                        <span className="text-sm font-medium">Help</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex sm:hidden items-center">
              <button
                onClick={toggleMobileMenu}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
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
              ? 'max-h-[500px] border-b border-border/50 bg-surface-primary/95 backdrop-blur-xl'
              : 'max-h-0'
          }`}
        >
          <div className="px-4 py-3 space-y-2">
            {!session ? (
              <>
                <button
                  onClick={() => openAuthModal('signin')}
                  className="flex w-full items-center space-x-3 px-3 py-3 min-h-[44px] rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-medium text-base">Sign In</span>
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="flex w-full items-center space-x-3 px-3 py-3 min-h-[44px] rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="font-medium text-base">Create Account</span>
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-2 mb-2 bg-surface-hover rounded-lg">
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-0.5">
                    Signed in as
                  </p>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {session.user.email}
                  </p>
                </div>
                <button
                  onClick={() => openAuthModal('security')}
                  className="flex w-full items-center space-x-3 px-3 py-3 min-h-[44px] rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-medium text-base">
                    Security Settings
                  </span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center space-x-3 px-3 py-3 min-h-[44px] rounded-lg transition-colors duration-200 text-red-500 hover:bg-red-500/10 active:bg-red-500/20"
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
              className="flex w-full items-center space-x-3 px-3 py-3 min-h-[44px] rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
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
              className="flex w-full items-center space-x-3 px-3 py-3 min-h-[44px] rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium text-base">Help</span>
            </button>
          </div>
        </div>
      </nav>

      <HelpCenter isOpen={isHelpOpen} onClose={handleCloseHelp} theme={theme} />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />
    </>
  );
}

export default memo(Navbar);
