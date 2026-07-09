import { memo, useEffect } from 'react';
import { Link } from 'wouter';

import {
  Info,
  LogIn,
  LogOut,
  Settings,
  UserPlus,
  UserCircle,
  X
} from '@/assets/icons';

import { useAuth, type MembershipTier } from '@/auth';
import { usePrefetchRoute, useScrollLock } from '@hooks';
import { MembershipBadge, AvatarInitial } from '@ui';

import styles from './styles/navbar.module.scss';

// Types
interface NavbarDesktopMenuProps {
  isAuthenticated: boolean;
  isDesktopDropdownOpen: boolean;
  setIsDesktopDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  handleSignOut: () => void;
}

interface NavbarMobileMenuProps {
  isOpen: boolean;
  isAuthenticated: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleSignOut: () => void;
}

// Helpers
function ProfileHeader({
  displayName,
  membershipTier,
  isAuthenticated,
  avatarSize
}: {
  displayName: string;
  membershipTier: MembershipTier;
  isAuthenticated: boolean;
  avatarSize: 'sm' | 'md';
}) {
  return (
    <div className={styles['profileHeader']}>
      <AvatarInitial displayName={displayName} size={avatarSize} />
      <div className={styles['profileInfo']}>
        <p className={styles['profileName']}>
          {displayName || (isAuthenticated ? 'ChessViewer user' : 'Local user')}
        </p>
        <MembershipBadge tier={membershipTier} variant="plain" />
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: typeof Settings;
  label: string;
  className: string;
  iconSize: string;
  onNavigate: () => void;
  prefetch: ReturnType<typeof usePrefetchRoute>;
}

function NavItem({
  to,
  icon: Icon,
  label,
  className,
  iconSize,
  onNavigate,
  prefetch
}: NavItemProps) {
  return (
    <Link
      href={to}
      {...prefetch(to)}
      onClick={onNavigate}
      className={className}
    >
      <Icon className={iconSize} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function NavLinks({
  className,
  iconSize,
  onNavigate
}: {
  className: string;
  iconSize: string;
  onNavigate: () => void;
}) {
  const prefetch = usePrefetchRoute();

  return (
    <>
      <NavItem
        to="/settings?tab=profile"
        icon={Settings}
        label="Settings"
        className={className}
        iconSize={iconSize}
        onNavigate={onNavigate}
        prefetch={prefetch}
      />
      <NavItem
        to="/about"
        icon={Info}
        label="About"
        className={className}
        iconSize={iconSize}
        onNavigate={onNavigate}
        prefetch={prefetch}
      />
    </>
  );
}

function AuthActions({
  isAuthenticated,
  className,
  iconSize,
  onNavigate,
  handleSignOut
}: {
  isAuthenticated: boolean;
  className: string;
  iconSize: string;
  onNavigate: () => void;
  handleSignOut: () => void;
}) {
  const prefetch = usePrefetchRoute();

  if (isAuthenticated) {
    const iconSizeOnly = iconSize.replace(/text-\S+/g, '').trim();
    return (
      <button
        type="button"
        onClick={() => {
          onNavigate();
          handleSignOut();
        }}
        className={styles['menuItemDanger']}
      >
        <LogOut className={`${iconSizeOnly} text-error`} aria-hidden="true" />
        <span className="text-error">Sign Out</span>
      </button>
    );
  }

  return (
    <>
      <NavItem
        to="/auth/sign-in"
        icon={LogIn}
        label="Sign In"
        className={className}
        iconSize={iconSize}
        onNavigate={onNavigate}
        prefetch={prefetch}
      />
      <NavItem
        to="/auth/sign-up"
        icon={UserPlus}
        label="Sign Up"
        className={className}
        iconSize={iconSize}
        onNavigate={onNavigate}
        prefetch={prefetch}
      />
    </>
  );
}

export const NavbarDesktopMenu = memo(function NavbarDesktopMenu({
  isAuthenticated,
  isDesktopDropdownOpen,
  setIsDesktopDropdownOpen,
  dropdownRef,
  handleSignOut
}: NavbarDesktopMenuProps) {
  const { profile, membershipTier } = useAuth();
  const displayName = profile.displayName;

  const itemClass = styles['menuItem'];

  const closeDropdown = () => setIsDesktopDropdownOpen(false);

  return (
    <div className={styles['desktopDropdownWrapper']} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDesktopDropdownOpen(!isDesktopDropdownOpen)}
        className={`${styles['desktopDropdownToggle']} ${isDesktopDropdownOpen ? styles['desktopDropdownToggleActive'] : ''}`}
        aria-label="Account menu"
        aria-expanded={isDesktopDropdownOpen}
        aria-haspopup="menu"
      >
        {isDesktopDropdownOpen ? (
          <X className="w-6 h-6" aria-hidden="true" />
        ) : (
          <UserCircle className="w-6 h-6" aria-hidden="true" />
        )}
      </button>

      <div
        className={`${styles['desktopDropdownPanel']} ${styles['desktopDropdown']}`}
        data-state={isDesktopDropdownOpen ? 'open' : 'closed'}
        role="menu"
      >
        <div className="px-2 pb-1">
          <ProfileHeader
            displayName={displayName}
            membershipTier={membershipTier}
            isAuthenticated={isAuthenticated}
            avatarSize="md"
          />
        </div>

        <div className="h-px bg-border my-3" />

        <div className="flex flex-col gap-0.5">
          <NavLinks
            className={itemClass ?? ''}
            iconSize="w-4 h-4 text-text-secondary"
            onNavigate={closeDropdown}
          />
        </div>

        <div className="h-px bg-border my-3" />

        <div className="flex flex-col gap-0.5">
          <AuthActions
            isAuthenticated={isAuthenticated}
            className={itemClass ?? ''}
            iconSize="w-4 h-4 text-text-secondary"
            onNavigate={closeDropdown}
            handleSignOut={handleSignOut}
          />
        </div>
      </div>
    </div>
  );
});

NavbarDesktopMenu.displayName = 'NavbarDesktopMenu';

export const NavbarMobileMenu = memo(function NavbarMobileMenu({
  isOpen,
  isAuthenticated,
  setIsMobileMenuOpen,
  handleSignOut
}: NavbarMobileMenuProps) {
  const { profile, membershipTier } = useAuth();
  const displayName = profile.displayName;

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, setIsMobileMenuOpen]);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <div
        className={`${styles['mobileBackdrop']} fixed inset-0 z-40 bg-bg/80 backdrop-blur-sm lg:hidden`}
        data-state={isOpen ? 'open' : 'closed'}
        aria-hidden="true"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div
        className={`${styles['mobileMenuContainer']} ${styles['mobilePanel']}`}
        data-state={isOpen ? 'open' : 'closed'}
      >
        <div className="page-container">
          <div className={styles['mobileMenuContent']}>
            <div className={styles['menuSection']}>
              <ProfileHeader
                displayName={displayName}
                membershipTier={membershipTier}
                isAuthenticated={isAuthenticated}
                avatarSize="sm"
              />
            </div>

            <div className={styles['menuDivider']} />

            <div className={styles['menuSection']}>
              <NavLinks
                className={styles['menuItem'] ?? ''}
                iconSize="w-5 h-5"
                onNavigate={closeMenu}
              />
            </div>

            <div className={styles['menuDivider']} />

            <div className={styles['menuSection']}>
              <AuthActions
                isAuthenticated={isAuthenticated}
                className={styles['menuItem'] ?? ''}
                iconSize="w-5 h-5"
                onNavigate={closeMenu}
                handleSignOut={handleSignOut}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

NavbarMobileMenu.displayName = 'NavbarMobileMenu';
