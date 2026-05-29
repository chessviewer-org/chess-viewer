import React, { useState } from 'react';

import { ArrowLeft, KeyRound, ShieldAlert } from 'lucide-react';

import { logger } from '@utils/logger';
import { supabase } from '../services/supabaseClient';

/** Props for the `MfaVerification` TOTP/backup-code form. */
interface MfaVerificationProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function MfaVerification({ onSuccess, onBack }: MfaVerificationProps) {
  const [code, setCode] = useState<string>('');
  const [mode, setMode] = useState<'totp' | 'backup'>('totp');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factors.totp.find((f) => f.status === 'verified');
      if (!totpFactor) {
        setError('No verified TOTP factor found.');
        setIsSubmitting(false);
        return;
      }

      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: totpFactor.id
        });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: code.trim()
      });

      if (verifyError) {
        setError('Invalid verification code.');
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      logger.error('MFA TOTP error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: isValid, error: verifyError } = await supabase.rpc(
        'verify_recovery_code',
        {
          code: code.trim().toUpperCase()
        }
      );

      if (verifyError || !isValid) {
        setError('Invalid or already used backup code.');
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      logger.error('MFA Backup error:', err);
      setError('Failed to verify backup code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
          {mode === 'totp' ? (
            <ShieldAlert className="w-6 h-6 text-accent" />
          ) : (
            <KeyRound className="w-6 h-6 text-accent" />
          )}
        </div>
        <h3 className="text-lg font-bold text-text-primary">
          {mode === 'totp'
            ? 'Two-Factor Authentication'
            : 'Backup Code Verification'}
        </h3>
        <p className="text-text-secondary text-sm px-4">
          {mode === 'totp'
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter one of your 8-character recovery codes.'}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-error/10 text-error border border-error/20 text-sm rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      <form
        onSubmit={mode === 'totp' ? handleVerifyTotp : handleVerifyBackup}
        className="flex flex-col gap-4"
      >
        <input
          type="text"
          placeholder={mode === 'totp' ? '000000' : 'ABC12345'}
          className="w-full text-center text-lg tracking-[0.2em] font-mono rounded-xl border border-border bg-surface-elevated px-4 py-3 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/35 outline-none transition-colors duration-200"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={mode === 'totp' ? 6 : 8}
          required
          autoFocus
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accent text-bg px-4 py-3 rounded-xl hover:bg-accent-hover transition-colors duration-200 font-semibold shadow-md disabled:opacity-50"
        >
          {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
        </button>
      </form>

      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={() => {
            setMode(mode === 'totp' ? 'backup' : 'totp');
            setCode('');
            setError('');
          }}
          className="text-xs font-medium text-accent hover:underline underline-offset-4"
        >
          {mode === 'totp'
            ? 'Use a backup code instead'
            : 'Use authenticator app'}
        </button>

        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
