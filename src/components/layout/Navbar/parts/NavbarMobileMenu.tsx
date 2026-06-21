import { memo, useEffect } from 'react';

import {
  Crown,
  Diamond,
  Gem,
  HeartHandshake,
  Info,
  LogIn,
  LogOut,
  Settings,
  Star,
  UserCircle,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useProfile } from '@/features/auth/hooks/useProfile';
import type { MembershipTierId } from '@/features/auth/services/membership';
import { usePrefetchRoute } from '@hooks';

const DONATE_URL = 'https://github.com/sponsors/chessvision-org';

const TIER_CONFIG: Record<
  Exclude<MembershipTierId, 'none'>,
  { icon: React.ElementType; label: string; classes: string }
> = {
  gold: {
    icon: Star,
    label: 'Gold Supporter',
    classes: 'text-[var(--color-gold,#f59e0b)]'
  },
  platinum: {
    icon: Gem,
    label: 'Platinum Supporter',
    classes: 'text-[var(--color-platinum,#94a3b8)]'
  },
  diamond: {
    icon: Diamond,
    label: 'Diamond Supporter',
    classes: 'text-[var(--color-diamond,#38bdf8)]'
  },
  patron: {
    icon: Crown,
    label: 'Patron',
    classes: 'text-[var(--color-patron,#a78bfa)]'
  }
};

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
  const { displayName, isSupporter, membershipTier } = useProfile();

  const tierCfg =
    isSupporter && membershipTier.id !== 'none'
      ? TIER_CONFIG[membershipTier.id as Exclude<MembershipTierId, 'none'>]
      : null;

  // Lock background scroll while open; close on Escape.
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

  const linkClass =
    'flex w-full items-center gap-3 px-3 py-3.5 min-h-12 rounded-lg transition-colors duration-200 text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 top-0 z-40 bg-black/50 backdrop-blur-[1px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        id="mobile-nav-menu"
        // When collapsed the panel is visually clipped (`max-h-0`) but its links
        // and buttons would still be in the tab order — a keyboard user would
        // tab into invisible controls. `inert` removes the whole subtree from
        // focus order and the accessibility tree while closed (WCAG 2.4.3 /
        // 4.1.2). React 19 forwards `inert` as a boolean attribute.
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`lg:hidden relative z-50 overflow-hidden transition-all duration-400 ease-out bg-surface ${
          isOpen
            ? 'max-h-160 border-b border-border/50'
            : 'max-h-0 border-b border-transparent'
        }`}
      >
        <div className="px-4 py-3">
          {/* Profile block */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-11 h-11 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-lg uppercase shrink-0">
              {displayName ? (
                displayName.charAt(0)
              ) : (
                <UserCircle className="w-8 h-8" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-text-primary truncate">
                {displayName ||
                  (isAuthenticated ? 'ChessVision user' : 'Local user')}
              </p>
              {tierCfg ? (
                <span
                  className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${tierCfg.classes}`}
                >
                  <tierCfg.icon className="w-4 h-4" aria-hidden="true" />
                  {tierCfg.label}
                </span>
              ) : (
                <a
                  href={DONATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  <HeartHandshake className="w-4 h-4" aria-hidden="true" />
                  Support ChessVision
                </a>
              )}
            </div>
          </div>

          <div className="border-t border-border/50 my-3" />

          {/* Navigation group: Settings + About */}
          <Link
            to="/settings?tab=profile"
            {...prefetch('/settings')}
            onClick={() => setIsMobileMenuOpen(false)}
            className={linkClass}
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium text-base">Settings</span>
          </Link>
          <Link
            to="/about"
            {...prefetch('/about')}
            onClick={() => setIsMobileMenuOpen(false)}
            className={linkClass}
          >
            <Info className="w-5 h-5" aria-hidden="true" />
            <span className="font-medium text-base">About</span>
          </Link>

          <div className="border-t border-border/50 my-3" />

          {/* Auth group */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-3.5 min-h-12 rounded-lg transition-colors duration-200 text-error hover:bg-error/10 active:bg-error/20"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium text-base">Sign Out</span>
            </button>
          ) : (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal('signin');
                }}
                className={linkClass}
              >
                <LogIn className="w-5 h-5" aria-hidden="true" />
                <span className="font-medium text-base">Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openAuthModal('signup');
                }}
                className={linkClass}
              >
                <UserPlus className="w-5 h-5" aria-hidden="true" />
                <span className="font-medium text-base">Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
});
