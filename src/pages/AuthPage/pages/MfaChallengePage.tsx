import { type FormEvent, useState } from 'react';

import { KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { supabase } from '@/features/auth/services/supabaseClient';

import { logger } from '@utils';
import { AuthPage } from '../AuthPage';

type MfaMode = 'totp' | 'backup';

export function MfaChallengePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<MfaMode>('totp');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuccess = () => navigate('/');

  const handleVerifyTotp = async () => {
    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;

    const totpFactor = factors.totp.find((f) => f.status === 'verified');
    if (!totpFactor) {
      setError('No verified TOTP factor found.');
      return;
    }

    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeError) throw challengeError;

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challenge.id,
      code: code.trim()
    });

    if (verifyError) {
      setError('Invalid verification code.');
    } else {
      handleSuccess();
    }
  };

  const handleVerifyBackup = async () => {
    const { data: isValid, error: verifyError } = await supabase.rpc(
      'verify_recovery_code',
      { code: code.trim().toUpperCase() }
    );

    if (verifyError || !isValid) {
      setError('Invalid or already used backup code.');
    } else {
      handleSuccess();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (mode === 'totp') {
        await handleVerifyTotp();
      } else {
        await handleVerifyBackup();
      }
    } catch (err: unknown) {
      logger.error('MFA verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTotp = mode === 'totp';

  return (
    <AuthPage>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            {isTotp ? (
              <ShieldAlert className="h-6 w-6 text-accent" aria-hidden="true" />
            ) : (
              <KeyRound className="h-6 w-6 text-accent" aria-hidden="true" />
            )}
          </div>
          <h1 className="font-display text-xl font-bold text-text-primary">
            {isTotp ? 'Two-Factor Authentication' : 'Backup Code Verification'}
          </h1>
          <p className="px-2 text-sm text-text-secondary">
            {isTotp
              ? 'Enter the 6-digit code from your authenticator app.'
              : 'Enter one of your 16-character recovery codes.'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-center text-sm font-medium text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="mfa-code" className="sr-only">
            {isTotp ? 'Authenticator code' : 'Backup recovery code'}
          </label>
          <input
            id="mfa-code"
            type="text"
            inputMode={isTotp ? 'numeric' : 'text'}
            placeholder={isTotp ? '000000' : 'A1B2C3D4E5F6A7B8'}
            className="w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-text-primary outline-none transition-colors duration-200 focus:border-accent/50 focus:ring-1 focus:ring-accent/30"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={isTotp ? 6 : 16}
            required
            autoFocus
            autoComplete="one-time-code"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {isSubmitting ? 'Verifying…' : 'Verify & Sign In'}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setMode(isTotp ? 'backup' : 'totp');
              setCode('');
              setError('');
            }}
            className="text-xs font-medium text-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {isTotp ? 'Use a backup code instead' : 'Use authenticator app'}
          </button>

          <Link
            to="/auth/sign-in"
            className="text-xs text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </AuthPage>
  );
}

export default MfaChallengePage;
