import { memo, useEffect } from 'react';

import { Info, LogOut, Shield, User, UserCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useProfile } from '@/features/auth/hooks/useProfile';
import { usePrefetchRoute } from '@hooks';

const DONATE_URL = 'https://github.com/sponsors/chessvision-org';

/** Props for the `NavbarMobileMenu` slide-down panel. */
interface NavbarMobileMenuProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openAuthModal: (tab: 'signin' | 'signup' | 'security') => void;
  handleSignOut: () => void;
}

export const NavbarMobileMenu = memo(function NavbarMobileMenu({
  isOpen,
  isAuthenticated,
  setIsMobileMenuOpen,
  openAuthModal,
  handleSignOut
}: NavbarMobileMenuProps) {
  const prefetch = usePrefetchRoute();
  const { displayName, avatarUrl, isSupporter } = useProfile();

  // Lock background scroll while the slide-down menu is open, and close it on
  // Escape. Cleanup restores `overflow` to avoid a leak (matches ShareDialog).
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, setIsMobileMenuOpen]);

  return (
    <>
      {/* Backdrop scrim — closes the menu on tap and visually separates the
          slide-down panel from the page content behind it. */}
      <div
        className={`sm:hidden fixed inset-0 top-0 z-40 bg-black/50 backdrop-blur-[1px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        id="mobile-nav-menu"
        className={`sm:hidden relative z-50 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? 'max-h-[34rem] border-b border-border/50 bg-surface'
            : 'max-h-0'
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
                <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                  <Shield className="w-4 h-4" />
                  ChessVision Supporter
                </span>
              ) : (
                <a
                  href={DONATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
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
                className="flex w-full items-center space-x-3 px-3 py-3.5 min-h-12 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
              >
                <User className="w-5 h-5" />
                <span className="font-medium text-base">Settings</span>
              </Link>

              <div className="border-t border-border/50 my-3" />
            </>
          )}

          {/* Bottom: About, then Sign Out / Add Account at the very bottom. The
              site follows the OS light/dark setting, so there is no manual theme
              toggle here (removed by design — see App.tsx). */}
          <Link
            to="/about"
            {...prefetch('/about')}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex w-full items-center space-x-3 px-3 py-3.5 min-h-12 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
          >
            <Info className="w-5 h-5" />
            <span className="font-medium text-base">About</span>
          </Link>
          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="flex w-full items-center space-x-3 px-3 py-3.5 min-h-12 rounded-lg transition-colors duration-200 text-error hover:bg-error/10 active:bg-error/20"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-base">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('signup')}
              className="flex w-full items-center space-x-3 px-3 py-3.5 min-h-12 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated"
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-medium text-base">Add Account</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
});
