import { useState } from 'react';

import { supabase } from '@/features/auth/services/supabaseClient';

export type SecurityUnlockMode = 'password' | 'backup' | 'mfa';

/**
 * Drives the security re-verification flow for {@link SecurityLockModal}.
 *
 * Owns the shared form state and the three Supabase-backed verification
 * handlers (password → optional MFA escalation, TOTP, backup code). All calls
 * go through the singleton client; no RLS/RPC policies are touched.
 *
 * @param onUnlock - Invoked once the user's identity is positively confirmed.
 * @returns Field state, the active mode, status flags, and form submit handlers.
 */
export function useSecurityUnlock(onUnlock: () => void) {
  const [password, setPassword] = useState<string>('');
  const [backupCode, setBackupCode] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [mode, setMode] = useState<SecurityUnlockMode>('password');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setError('Unable to retrieve account email.');
      setIsSubmitting(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password
    });

    if (signInError) {
      setError('Invalid password. Please try again.');
      setIsSubmitting(false);
      return;
    }

    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    const hasVerifiedMfa =
      !factorsError &&
      factors &&
      factors.totp.some((f) => f.status === 'verified');

    if (hasVerifiedMfa) {
      setMode('mfa');
    } else {
      onUnlock();
    }

    setIsSubmitting(false);
  };

  const handleMfaVerify = async (e: React.FormEvent<HTMLFormElement>) => {
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
        setMode('password');
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
        code: totpCode.trim()
      });

      if (verifyError) {
        setError('Invalid verification code.');
      } else {
        onUnlock();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'MFA verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { data: isValid, error: verifyError } = await supabase.rpc(
      'verify_recovery_code',
      {
        code: backupCode
      }
    );

    if (verifyError || !isValid) {
      setError(verifyError?.message || 'Invalid or already used backup code.');
    } else {
      onUnlock();
    }

    setIsSubmitting(false);
  };

  return {
    password,
    setPassword,
    backupCode,
    setBackupCode,
    totpCode,
    setTotpCode,
    mode,
    setMode,
    error,
    setError,
    isSubmitting,
    handlePasswordSubmit,
    handleMfaVerify,
    handleBackupSubmit
  };
}
