import { memo, useState } from 'react';

import { KeyRound, ShieldCheck } from 'lucide-react';

import { useModal } from '@/contexts';
import { TwoFactorSetup } from '@/features/auth/components/TwoFactorSetup';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/features/auth/services/supabaseClient';
import { useLocalStorage } from '@hooks';

import { logger } from '@utils/logger';
import { Switch } from '@shared/ui';

/**
 * Security section: two-factor setup, a self-service password-reset email, and
 * local security-behaviour toggles rendered as grey→amber slider switches.
 * Guests see a sign-in prompt instead of the account-bound controls.
 */
const SecuritySection = memo(function SecuritySection() {
  const { user, isAuthenticated } = useAuth();
  const { showAlert } = useModal();

  const [confirmDestructive, setConfirmDestructive] = useLocalStorage<boolean>(
    'cv_security_confirm_destructive',
    true
  );
  const [hideSensitive, setHideSensitive] = useLocalStorage<boolean>(
    'cv_security_hide_sensitive',
    false
  );

  const [sendingReset, setSendingReset] = useState(false);

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

  return (
    <div className="space-y-10 animate-pageEnter">
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-text-primary">
        <ShieldCheck
          className="h-5 w-5 text-text-secondary"
          aria-hidden="true"
        />
        Security
      </h2>

      {isAuthenticated ? (
        <>
          <section className="overflow-hidden rounded-2xl border border-border bg-surface-elevated">
            <div className="border-b border-border/50 p-6">
              <h3 className="mb-1 text-sm font-bold text-text-primary">
                Two-Factor Authentication
              </h3>
              <p className="mb-4 text-xs text-text-secondary">
                Use a time-based one-time passcode (TOTP) from an authenticator
                app as a second factor when you sign in.
              </p>
              <TwoFactorSetup />
            </div>

            <div className="p-6">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-text-primary">
                <KeyRound
                  className="h-4 w-4 text-text-muted"
                  aria-hidden="true"
                />
                Password
              </h3>
              <p className="mb-4 text-xs text-text-secondary">
                Passwords can&apos;t be edited here. Send yourself a secure
                reset link to change it.
              </p>
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={sendingReset}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingReset ? 'Sending…' : 'Send Password Reset Email'}
              </button>
            </div>
          </section>

          <section className="space-y-5 rounded-2xl border border-border bg-surface-elevated p-6">
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
        <div className="rounded-2xl border border-border bg-surface-elevated p-10 text-center">
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
