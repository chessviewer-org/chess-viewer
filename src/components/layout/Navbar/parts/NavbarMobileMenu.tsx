import { memo } from 'react';

import type { Session } from '@supabase/supabase-js';
import {
  HelpCircle,
  LogIn,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  User,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { usePrefetchRoute } from '@hooks';

/** Props for the `NavbarMobileMenu` slide-down panel. */
interface NavbarMobileMenuProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  toggleTheme: (event?: React.SyntheticEvent | Event) => void;
  isAuthenticated: boolean;
  session: Session | null;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openAuthModal: (tab: 'signin' | 'signup' | 'security') => void;
  handleSignOut: () => void;
  handleHelpClick: () => void;
}

export const NavbarMobileMenu = memo(function NavbarMobileMenu({
  isOpen,
  theme,
  toggleTheme,
  isAuthenticated,
  session,
  setIsMobileMenuOpen,
  openAuthModal,
  handleSignOut,
  handleHelpClick
}: NavbarMobileMenuProps) {
  const prefetch = usePrefetchRoute();

  return (
    <div
      className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-125 border-b border-border/50 bg-surface' : 'max-h-0'
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
                {session?.user?.email}
              </p>
            </div>

            <Link
              to="/settings?tab=profile"
              {...prefetch('/settings')}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
            >
              <User className="w-5 h-5" />
              <span className="font-medium text-base">Account Profile</span>
            </Link>

            <Link
              to="/settings?tab=security"
              {...prefetch('/settings')}
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
  );
});
