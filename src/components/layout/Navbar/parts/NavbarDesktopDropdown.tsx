import { memo } from 'react';

import type { Session } from '@supabase/supabase-js';
import {
  Database,
  HelpCircle,
  LogOut,
  ShieldCheck,
  User,
  UserCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { ThemeSubmenu } from './ThemeSubmenu';

type SubmenuKey = 'settings' | 'theme' | null;

/** Props for the `NavbarDesktopDropdown` popover menu. */
interface NavbarDesktopDropdownProps {
  theme: 'light' | 'dark';
  toggleTheme: (event?: React.SyntheticEvent | Event) => void;
  isAuthenticated: boolean;
  session: Session | null;
  isDropdownOpen: boolean;
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openSubmenu: SubmenuKey;
  setOpenSubmenu: React.Dispatch<React.SetStateAction<SubmenuKey>>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  openAuthModal: (tab: 'signin' | 'signup' | 'security') => void;
  handleSignOut: () => void;
  handleHelpClick: () => void;
}

export const NavbarDesktopDropdown = memo(function NavbarDesktopDropdown({
  theme,
  toggleTheme,
  isAuthenticated,
  session,
  isDropdownOpen,
  setIsDropdownOpen,
  openSubmenu,
  setOpenSubmenu,
  dropdownRef,
  openAuthModal,
  handleSignOut,
  handleHelpClick
}: NavbarDesktopDropdownProps) {
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

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-68 rounded-2xl border border-border/60 bg-surface p-3 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-xl border border-border bg-surface-elevated p-3">
            {!isAuthenticated ? (
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

                <ThemeSubmenu
                  theme={theme}
                  toggleTheme={toggleTheme}
                  openSubmenu={openSubmenu}
                  setOpenSubmenu={setOpenSubmenu}
                  setIsDropdownOpen={setIsDropdownOpen}
                />
                {renderHelpButton()}
              </div>
            ) : (
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

                  <ThemeSubmenu
                    theme={theme}
                    toggleTheme={toggleTheme}
                    openSubmenu={openSubmenu}
                    setOpenSubmenu={setOpenSubmenu}
                    setIsDropdownOpen={setIsDropdownOpen}
                  />

                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-text-secondary" />
                    <span>Sign Out</span>
                  </button>

                  <div className="h-px bg-border my-1" />

                  {renderHelpButton()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
