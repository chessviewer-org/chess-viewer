import { memo } from 'react';

import {
  Info,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
  UserCircle,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useProfile } from '@/features/auth/hooks/useProfile';
import { usePrefetchRoute } from '@hooks';

const DONATE_URL = 'https://www.buymeacoffee.com/bilgegates';

/** Props for the `NavbarMobileMenu` slide-down panel. */
interface NavbarMobileMenuProps {
  isOpen: boolean;
  theme: 'light' | 'dark';
  toggleTheme: (event?: React.SyntheticEvent | Event) => void;
  isAuthenticated: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openAuthModal: (tab: 'signin' | 'signup' | 'security') => void;
  handleSignOut: () => void;
}

export const NavbarMobileMenu = memo(function NavbarMobileMenu({
  isOpen,
  theme,
  toggleTheme,
  isAuthenticated,
  setIsMobileMenuOpen,
  openAuthModal,
  handleSignOut
}: NavbarMobileMenuProps) {
  const prefetch = usePrefetchRoute();
  const { displayName, avatarUrl, isSupporter } = useProfile();

  return (
    <div
      className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-125 border-b border-border/50 bg-surface' : 'max-h-0'
      }`}
    >
      <div className="px-4 py-3">
        {/* Top: profile block — name + donate/supporter line (everyone, unified model) */}
        <div className="flex items-center gap-3 px-3 py-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-11 h-11 rounded-full object-cover shrink-0"
            />
          ) : (
            <UserCircle className="w-11 h-11 text-text-secondary shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-base font-bold text-text-primary truncate">
              {displayName}
            </p>
            {isSupporter ? (
              <span className="mt-1 flex items-center gap-1.5 text-sm font-medium text-accent">
                <Shield className="w-4 h-4" />
                ChessVision Supporter
              </span>
            ) : (
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-accent transition-colors"
              >
                <Shield className="w-4 h-4" />
                Donate ChessVision
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-border/50 my-3" />

        {/* Middle: Account — authenticated users only */}
        {isAuthenticated && (
          <>
            <Link
              to="/settings?tab=profile"
              {...prefetch('/settings')}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
            >
              <User className="w-5 h-5" />
              <span className="font-medium text-base">Account</span>
            </Link>

            <div className="border-t border-border/50 my-3" />
          </>
        )}

        {/* Bottom: About (+ theme), then Sign Out / Add Account at the very bottom */}
        <Link
          to="/about"
          {...prefetch('/about')}
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
        >
          <Info className="w-5 h-5" />
          <span className="font-medium text-base">About</span>
        </Link>
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
        {isAuthenticated ? (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-error hover:bg-error/10 active:bg-error/20"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-base">Sign Out</span>
          </button>
        ) : (
          <button
            onClick={() => openAuthModal('signup')}
            className="flex w-full items-center space-x-3 px-3 py-3 min-h-11 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
          >
            <UserPlus className="w-5 h-5" />
            <span className="font-medium text-base">Add Account</span>
          </button>
        )}
      </div>
    </div>
  );
});
