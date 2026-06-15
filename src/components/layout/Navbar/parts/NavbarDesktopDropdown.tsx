import { memo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Info,
  LogOut,
  Settings,
  Shield,
  UserCircle,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useProfile } from '@/features/auth/hooks/useProfile';
import { usePrefetchRoute } from '@hooks';

const DONATE_URL = 'https://github.com/sponsors/chessvision-org';

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
  const { displayName, avatarUrl, isSupporter } = useProfile();
  const prefetch = usePrefetchRoute();

  const itemClass =
    'w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2';

  return (
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

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-2 w-68 rounded-2xl border border-border/60 bg-surface p-3 shadow-2xl z-50 origin-top-right flex flex-col"
          >
            <div className="flex items-center gap-3 px-2 pb-1">
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

            <div className="h-px bg-border my-3" />

            {isAuthenticated && (
              <>
                <Link
                  to="/settings?tab=profile"
                  {...prefetch('/settings')}
                  onClick={() => setIsDropdownOpen(false)}
                  className={itemClass}
                >
                  <Settings className="w-4 h-4 text-text-secondary" />
                  <span>Settings</span>
                </Link>

                <div className="h-px bg-border my-3" />
              </>
            )}

            <div className="flex flex-col gap-1">
              <Link
                to="/about"
                {...prefetch('/about')}
                onClick={() => setIsDropdownOpen(false)}
                className={itemClass}
              >
                <Info className="w-4 h-4 text-text-secondary" />
                <span>About</span>
              </Link>
              {isAuthenticated ? (
                <button onClick={handleSignOut} className={itemClass}>
                  <LogOut className="w-4 h-4 text-text-secondary" />
                  <span>Sign Out</span>
                </button>
              ) : (
                // Guests get full features locally; account is opt-in for sync + extra security.
                <button
                  onClick={() => openAuthModal('signup')}
                  className={itemClass}
                >
                  <UserPlus className="w-4 h-4 text-text-secondary" />
                  <span>Add Account</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
