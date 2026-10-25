import { memo, useEffect, useId, useRef, useLayoutEffect } from 'react';
import { Link } from 'wouter';
import { useOutsideClick } from '@/shared/hooks/useDOM';

import {
  Info,
  LogIn,
  LogOut,
  Settings,
  UserPlus,
  UserCircle
} from '@/assets/icons';

import { useAuth } from '@/auth/core/useAuth';
import { AvatarInitial } from '@/shared/ui/AvatarInitial';

import styles from './styles/navbar.module.scss';

// Types
interface NavbarAccountMenuProps {
  isAuthenticated: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  accountRef: React.RefObject<HTMLDivElement | null>;
  handleSignOut: () => void;
}

// Helpers
function ProfileHeader({
  displayName,
  isAuthenticated,
  avatarSize
}: {
  displayName: string;
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
}

function NavItem({
  to,
  icon: Icon,
  label,
  className,
  iconSize,
  onNavigate
}: NavItemProps) {
  return (
    <Link href={to} role="menuitem" onClick={onNavigate} className={className}>
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
  return (
    <>
      <NavItem
        to="/settings?tab=profile"
        icon={Settings}
        label="Settings"
        className={className}
        iconSize={iconSize}
        onNavigate={onNavigate}
      />
      <NavItem
        to="/about"
        icon={Info}
        label="About"
        className={className}
        iconSize={iconSize}
        onNavigate={onNavigate}
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
  if (isAuthenticated) {
    const iconSizeOnly = iconSize.replace(/text-\S+/g, '').trim();
    return (
      <button
        type="button"
        role="menuitem"
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
      />
      <NavItem
        to="/auth/sign-up"
        icon={UserPlus}
        label="Sign Up"
        className={className}
        iconSize={iconSize}
        onNavigate={onNavigate}
      />
    </>
  );
}

/** One anchored account dropdown at every screen size. */
export const NavbarAccountMenu = memo(function NavbarAccountMenu({
  isAuthenticated,
  isOpen,
  onOpenChange,
  accountRef,
  handleSignOut
}: NavbarAccountMenuProps) {
  const { profile } = useAuth();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const keyboardEntry = useRef<'first' | 'last' | null>(null);
  const id = useId();
  useLayoutEffect(() => {
    if (!isOpen || !keyboardEntry.current) return;
    const items =
      panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    const item =
      keyboardEntry.current === 'last' ? items?.[items.length - 1] : items?.[0];
    item?.focus();
    keyboardEntry.current = null;
  }, [isOpen]);

  useOutsideClick(
    [accountRef, panelRef],
    (event) => {
      onOpenChange(false);
      if (event.type === 'keydown') {
        event.preventDefault();
        event.stopPropagation();
        buttonRef.current?.focus();
      }
    },
    isOpen
  );

  useEffect(() => {
    if (!isOpen) return;
    const onFocus = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (
        !accountRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      )
        onOpenChange(false);
    };
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, [isOpen, onOpenChange, accountRef]);

  const close = () => onOpenChange(false);

  return (
    <div className={styles['accountWrapper']} ref={accountRef}>
      <button
        ref={buttonRef}
        id={`${id}-button`}
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            close();
            return;
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            keyboardEntry.current = event.key === 'ArrowUp' ? 'last' : 'first';
            if (isOpen) {
              const items =
                panelRef.current?.querySelectorAll<HTMLElement>(
                  '[role="menuitem"]'
                );
              (event.key === 'ArrowUp'
                ? items?.[items.length - 1]
                : items?.[0]
              )?.focus();
              keyboardEntry.current = null;
            } else onOpenChange(true);
          }
        }}
        className={styles['accountToggle']}
        aria-label="Account menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={`${id}-panel`}
      >
        <UserCircle className="w-6 h-6" aria-hidden="true" />
      </button>
      <div
        id={`${id}-panel`}
        ref={panelRef}
        className={styles['accountPanel']}
        role="menu"
        aria-labelledby={`${id}-button`}
        data-open={isOpen}
        inert={!isOpen}
        aria-hidden={!isOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close();
            buttonRef.current?.focus();
            return;
          }
          const items = Array.from(
            panelRef.current?.querySelectorAll<HTMLElement>(
              '[role="menuitem"]'
            ) ?? []
          );
          const index = items.indexOf(document.activeElement as HTMLElement);
          let next: number | undefined;
          if (event.key === 'ArrowDown') next = (index + 1) % items.length;
          if (event.key === 'ArrowUp')
            next = (index - 1 + items.length) % items.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = items.length - 1;
          if (next !== undefined) {
            event.preventDefault();
            items[next]?.focus();
          } else if (
            event.key === ' ' &&
            document.activeElement instanceof HTMLAnchorElement
          ) {
            event.preventDefault();
            document.activeElement.click();
          }
        }}
      >
        <div className={styles['accountHeader']} role="presentation">
          <ProfileHeader
            displayName={profile.displayName}
            isAuthenticated={isAuthenticated}
            avatarSize="sm"
          />
        </div>
        <div className={styles['accountLinks']} role="presentation">
          <NavLinks
            className={styles['menuItem'] ?? ''}
            iconSize="w-4 h-4 text-text-secondary"
            onNavigate={close}
          />
        </div>
        <div className={styles['accountLinks']} role="presentation">
          <AuthActions
            isAuthenticated={isAuthenticated}
            className={styles['menuItem'] ?? ''}
            iconSize="w-4 h-4 text-text-secondary"
            onNavigate={close}
            handleSignOut={handleSignOut}
          />
        </div>
      </div>
    </div>
  );
});

NavbarAccountMenu.displayName = 'NavbarAccountMenu';
