import { memo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
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
  UserPlus,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useProfile } from '@/features/auth/hooks/useProfile';
import type { MembershipTierId } from '@/features/auth/services/membership';
import { usePrefetchRoute } from '@hooks';

const DONATE_URL = 'https://github.com/sponsors/chessvision-org';

/** Tier badge config — icon + label + Tailwind colour utilities (token-based). */
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

/** Props for the `NavbarDesktopDropdown` popover menu. */
interface NavbarDesktopDropdownProps {
  isAuthenticated: boolean;
  isDropdownOpen: boolean;
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  openAuthModal: (tab: 'signin' | 'signup' | 'security') => void;
  handleSignOut: () => void;
}

export const NavbarDesktopDropdown = memo(function NavbarDesktopDropdown({
  isAuthenticated,
  isDropdownOpen,
  setIsDropdownOpen,
  dropdownRef,
  openAuthModal,
  handleSignOut
}: NavbarDesktopDropdownProps) {
  const { displayName, isSupporter, membershipTier } = useProfile();
  const prefetch = usePrefetchRoute();

  const itemClass =
    'w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2';

  const tierCfg =
    isSupporter && membershipTier.id !== 'none'
      ? TIER_CONFIG[membershipTier.id as Exclude<MembershipTierId, 'none'>]
      : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          isDropdownOpen
            ? 'bg-surface-elevated text-accent'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated'
        }`}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={isDropdownOpen}
      >
        {isDropdownOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        ) : (
          <UserCircle className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        )}
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: -12,
              scale: 0.95,
              transition: { duration: 0.15, ease: 'easeIn' }
            }}
            transition={{
              type: 'spring',
              damping: 22,
              stiffness: 260,
              mass: 0.8
            }}
            className="absolute top-full right-0 mt-3 w-68 rounded-none border-x border-b border-border/60 border-t-0 bg-surface-elevated p-3 shadow-2xl z-50 origin-top-right flex flex-col"
          >
            {/* Profile header */}
            <div className="flex items-center gap-3 px-2 pb-1">
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

            <div className="h-px bg-border my-3" />

            {/* Navigation group: Settings + About */}
            <div className="flex flex-col gap-0.5">
              <Link
                to="/settings?tab=profile"
                {...prefetch('/settings')}
                onClick={() => setIsDropdownOpen(false)}
                className={itemClass}
              >
                <Settings
                  className="w-4 h-4 text-text-secondary"
                  aria-hidden="true"
                />
                <span>Settings</span>
              </Link>
              <Link
                to="/about"
                {...prefetch('/about')}
                onClick={() => setIsDropdownOpen(false)}
                className={itemClass}
              >
                <Info
                  className="w-4 h-4 text-text-secondary"
                  aria-hidden="true"
                />
                <span>About</span>
              </Link>
            </div>

            <div className="h-px bg-border my-3" />

            {/* Auth group */}
            <div className="flex flex-col gap-0.5">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleSignOut();
                  }}
                  className="w-full rounded-lg px-2 py-2 text-sm font-medium text-error hover:bg-error/10 active:bg-error/20 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-error" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      openAuthModal('signin');
                    }}
                    className={itemClass}
                  >
                    <LogIn
                      className="w-4 h-4 text-text-secondary"
                      aria-hidden="true"
                    />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      openAuthModal('signup');
                    }}
                    className={itemClass}
                  >
                    <UserPlus
                      className="w-4 h-4 text-text-secondary"
                      aria-hidden="true"
                    />
                    <span>Sign Up</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
