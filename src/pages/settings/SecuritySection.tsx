import { memo, useCallback, useEffect, useState } from 'react';

import {
  History,
  KeyRound,
  LogOut,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';

import { useModal } from '@/contexts';
import { TwoFactorSetup } from '@/features/auth/components/TwoFactorSetup';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  type SecurityEvent,
  securityEventsService
} from '@/features/auth/services/securityEvents';
import { supabase } from '@/features/auth/services/supabaseClient';
import { useLocalStorage } from '@hooks';

import { logger } from '@utils/logger';
import { Switch } from '@shared/ui';
import { SettingsHeading } from './parts';

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

/** Human label for an audit `event_type`; unknown types fall back to themselves. */
const EVENT_LABELS: Record<string, string> = {
  SECURITY_REFRESH: 'Security re-verified',
  RECOVERY_CODES_GENERATED: 'Recovery codes generated',
  RECOVERY_CODE_SUCCESS: 'Recovery code used',
  RECOVERY_CODE_FAILURE: 'Recovery code failed',
  MFA_ENABLED: 'Two-factor enabled',
  MFA_DISABLED: 'Two-factor disabled',
  LOGIN_SUCCESS: 'Successful sign-in',
  LOGIN_FAILURE: 'Failed sign-in attempt',
  PASSWORD_CHANGE: 'Password changed'
};

function formatEventTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Security section: two-factor setup, an inline password change, a
 * password-reset email fallback, sign-out-everywhere, a recent security-events
 * log, and local security-behaviour toggles. Guests see a sign-in prompt.
 */
const SecuritySection = memo(function SecuritySection() {
  const { user, isAuthenticated } = useAuth();
  const { showAlert, showConfirm } = useModal();

  const [confirmDestructive, setConfirmDestructive] = useLocalStorage<boolean>(
    'cv_security_confirm_destructive',
    true
  );
  const [hideSensitive, setHideSensitive] = useLocalStorage<boolean>(
    'cv_security_hide_sensitive',
    false
  );

  const [sendingReset, setSendingReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  const loadEvents = useCallback(async () => {
    if (!isAuthenticated) return;
    const recent = await securityEventsService.recent(5);
    setEvents(recent);
  }, [isAuthenticated]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handlePasswordReset = async () => {
    if (!user?.email || sendingReset) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/settings?tab=security`
      });
      if (error) throw error;
      showAlert(
        'Check your inbox',
        `We sent a password reset link to ${user.email}.`,
        'info'
      );
    } catch (error) {
      logger.warn('Password reset request failed:', error);
      showAlert(
        'Could not send reset email',
        'Something went wrong. Please try again in a moment.',
        'danger'
      );
    } finally {
      setSendingReset(false);
    }
  };

  const passwordValid =
    newPassword.length >= MIN_PASSWORD &&
    newPassword.length <= MAX_PASSWORD &&
    newPassword === confirmPassword;

  const handlePasswordChange = async () => {
    if (!passwordValid || changingPassword) return;
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      showAlert(
        'Password updated',
        'Your password has been changed. Use it the next time you sign in.',
        'info'
      );
      void loadEvents();
    } catch (error) {
      logger.warn('Password change failed:', error);
      showAlert(
        'Could not change password',
        'We could not update your password. You may need to re-authenticate, then try again.',
        'danger'
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSignOutAll = async () => {
    if (signingOutAll) return;
    const confirmed = await showConfirm(
      'Sign out everywhere',
      'This signs you out on every device and browser where you are logged in. You will need to sign in again. Continue?',
      'warning'
    );
    if (!confirmed) return;
    setSigningOutAll(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      // The auth listener clears local state and the app reverts to guest.
    } catch (error) {
      logger.warn('Global sign-out failed:', error);
      showAlert(
        'Could not sign out everywhere',
        'Something went wrong. Please try again in a moment.',
        'danger'
      );
      setSigningOutAll(false);
    }
  };

  return (
    <div className="space-y-5 animate-pageEnter">
      <SettingsHeading icon={ShieldCheck} title="Security" />

      {isAuthenticated ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
            <div className="border-b border-border/50 p-5">
              <h3 className="mb-1 text-sm font-bold text-text-primary">
                Two-Factor Authentication
              </h3>
              <p className="mb-3 text-xs text-text-secondary">
                Use a time-based one-time passcode (TOTP) from an authenticator
                app as a second factor when you sign in.
              </p>
              <TwoFactorSetup />
            </div>

            <div className="p-5">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-text-primary">
                <KeyRound
                  className="h-4 w-4 text-text-muted"
                  aria-hidden="true"
                />
                Change Password
              </h3>
              <p className="mb-3 text-xs text-text-secondary">
                Set a new password (at least {MIN_PASSWORD} characters). It
                applies immediately on this device.
              </p>
              <div className="flex flex-col gap-2 sm:max-w-md">
                <label htmlFor="security-new-password" className="sr-only">
                  New password
                </label>
                <input
                  id="security-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  maxLength={MAX_PASSWORD}
                  disabled={changingPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
                />
                <label htmlFor="security-confirm-password" className="sr-only">
                  Confirm new password
                </label>
                <input
                  id="security-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  maxLength={MAX_PASSWORD}
                  disabled={changingPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handlePasswordChange();
                  }}
                  placeholder="Confirm new password"
                  aria-invalid={
                    confirmPassword.length > 0 &&
                    confirmPassword !== newPassword
                  }
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
                />
                {confirmPassword.length > 0 &&
                  confirmPassword !== newPassword && (
                    <p className="text-xs text-error">
                      Passwords do not match.
                    </p>
                  )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handlePasswordChange()}
                    disabled={!passwordValid || changingPassword}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {changingPassword ? 'Updating…' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={sendingReset}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    {sendingReset ? 'Sending…' : 'Email a reset link'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface-elevated p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-text-primary">
              <LogOut className="h-4 w-4 text-text-muted" aria-hidden="true" />
              Active Sessions
            </h3>
            <p className="mb-3 text-xs text-text-secondary">
              Sign out of every device and browser at once. Use this if you
              suspect your account is signed in somewhere you don&apos;t
              recognise.
            </p>
            <button
              type="button"
              onClick={handleSignOutAll}
              disabled={signingOutAll}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {signingOutAll ? 'Signing out…' : 'Sign out everywhere'}
            </button>
          </section>

          <section className="rounded-2xl border border-border bg-surface-elevated p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-text-primary">
              <History className="h-4 w-4 text-text-muted" aria-hidden="true" />
              Recent Security Activity
            </h3>
            <p className="mb-3 text-xs text-text-secondary">
              The latest security-related events on your account.
            </p>
            {events.length === 0 ? (
              <p className="text-xs text-text-muted">
                No recent activity to show.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-4 py-2.5 text-sm"
                  >
                    <span className="text-text-primary">
                      {EVENT_LABELS[event.eventType] ?? event.eventType}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatEventTime(event.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-border bg-surface-elevated p-5">
            <h3 className="text-sm font-bold text-text-primary">Preferences</h3>
            <Switch
              label="Confirm destructive actions"
              description="Require a confirmation prompt before deleting data or your account."
              checked={confirmDestructive}
              onChange={setConfirmDestructive}
            />
            <div className="h-px bg-border/50" />
            <Switch
              label="Hide sensitive details"
              description="Mask your email and security identifiers on shared screens."
              checked={hideSensitive}
              onChange={setHideSensitive}
            />
          </section>
        </>
      ) : (
        <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center">
          <p className="font-semibold text-text-primary">
            Sign in to manage security
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
            Two-factor authentication and password management are available once
            you&apos;re signed in.
          </p>
        </div>
      )}
    </div>
  );
});

SecuritySection.displayName = 'SecuritySection';
export default SecuritySection;
