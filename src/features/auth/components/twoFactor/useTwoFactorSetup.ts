import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/features/auth/services/supabaseClient';

import { logger } from '@utils/logger';
import {
  generateBackupCodes,
  getMfaErrorMessage,
  isMfa422Error
} from './mfaErrors';

/** Lifecycle of the on-mount MFA status probe. */
export type MfaStatus = 'loading' | 'enabled' | 'disabled';

/** Minimal view of a verified TOTP factor surfaced to the UI. */
export interface VerifiedFactor {
  id: string;
  friendlyName: string | null;
  createdAt: string | null;
}

/**
 * Drives the TOTP flow AND reflects the account's real MFA status.
 *
 * On mount (when signed in) it probes `mfa.listFactors()`: a verified TOTP
 * factor flips `status` to `'enabled'` and exposes a disable path; otherwise it
 * falls back to the three-step setup flow (start → QR verify → backup codes).
 *
 * Calls Supabase MFA APIs directly; backup codes are generated client-side with
 * `crypto.getRandomValues` and never stored server-side.
 */
export function useTwoFactorSetup() {
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isMfaUnavailable, setIsMfaUnavailable] = useState<boolean>(false);

  const [status, setStatus] = useState<MfaStatus>('loading');
  const [verifiedFactors, setVerifiedFactors] = useState<VerifiedFactor[]>([]);
  const [isDisabling, setIsDisabling] = useState<boolean>(false);

  /**
   * Reads the live factor list and reconciles local status. Returns the set of
   * verified TOTP factors so callers can act on them without a second read.
   */
  const refreshStatus = useCallback(async (): Promise<VerifiedFactor[]> => {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setStatus('disabled');
      setVerifiedFactors([]);
      return [];
    }

    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError || !factors) {
      if (isMfa422Error(factorsError)) setIsMfaUnavailable(true);
      // Treat an unreadable factor list as "not enabled" so the setup CTA still
      // works; a hard error surfaces only when the user acts.
      setStatus('disabled');
      setVerifiedFactors([]);
      return [];
    }

    const verified = factors.totp
      .filter((factor) => factor.status === 'verified')
      .map<VerifiedFactor>((factor) => ({
        id: factor.id,
        friendlyName: factor.friendly_name ?? null,
        createdAt: factor.created_at ?? null
      }));

    setVerifiedFactors(verified);
    setStatus(verified.length > 0 ? 'enabled' : 'disabled');
    return verified;
  }, []);

  // Probe real status once on mount; ignore the result if we unmount first.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refreshStatus();
      } catch (probeError) {
        if (!cancelled) {
          logger.warn('Failed to probe MFA status:', probeError);
          setStatus('disabled');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshStatus]);

  const handleSetupStart = async () => {
    if (isSubmitting || isMfaUnavailable) return;

    setError('');
    setIsSubmitting(true);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Please sign in to set up 2FA.');
      setIsSubmitting(false);
      return;
    }

    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError || !factors) {
      if (isMfa422Error(factorsError)) setIsMfaUnavailable(true);
      setError(
        factorsError
          ? getMfaErrorMessage(factorsError)
          : 'Failed to list 2FA factors.'
      );
      setIsSubmitting(false);
      return;
    }

    const hasVerifiedTotp = factors.totp.some(
      (factor) => factor.status === 'verified'
    );
    if (hasVerifiedTotp) {
      setStatus('enabled');
      await refreshStatus();
      setIsSubmitting(false);
      return;
    }

    const unverifiedFactors = factors.totp.filter(
      (factor) => (factor.status as string) === 'unverified'
    );
    for (const factor of unverifiedFactors) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id
      });
      if (unenrollError) {
        setError(
          'Failed to clear previous incomplete 2FA setup. Please try again.'
        );
        setIsSubmitting(false);
        return;
      }
    }

    const uniqueId = Math.random().toString(36).substring(2, 8);
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'ChessVision',
      friendlyName: user.email
        ? `${user.email} (${uniqueId})`
        : `ChessVision Auth (${uniqueId})`
    });

    if (enrollError || !data) {
      if (isMfa422Error(enrollError)) setIsMfaUnavailable(true);
      setError(
        enrollError
          ? getMfaErrorMessage(enrollError)
          : 'Failed to enroll in 2FA.'
      );
      setIsSubmitting(false);
      return;
    }

    if (data.type === 'totp') {
      setTotpUri(data.totp.uri);
      setSecret(data.totp.secret);
      setStep(2);
    }

    setIsSubmitting(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isMfaUnavailable) return;

    const normalizedCode = verifyCode.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError('Please enter a 6-digit verification code.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    if (factorsError || !factors) {
      if (isMfa422Error(factorsError)) setIsMfaUnavailable(true);
      setError(
        factorsError
          ? getMfaErrorMessage(factorsError)
          : 'Failed to list 2FA factors.'
      );
      setIsSubmitting(false);
      return;
    }

    const unverifiedFactor = factors.totp.find(
      (factor) => (factor.status as string) === 'unverified'
    );
    if (!unverifiedFactor) {
      setError(
        'No active unverified TOTP factor found. Please restart the setup.'
      );
      setStep(1);
      setIsSubmitting(false);
      return;
    }

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId: unverifiedFactor.id });
    if (challengeError || !challengeData) {
      if (isMfa422Error(challengeError)) setIsMfaUnavailable(true);
      setError(
        challengeError
          ? getMfaErrorMessage(challengeError)
          : 'Failed to challenge 2FA factor.'
      );
      setIsSubmitting(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: unverifiedFactor.id,
      challengeId: challengeData.id,
      code: normalizedCode
    });

    if (verifyError) {
      if (isMfa422Error(verifyError)) setIsMfaUnavailable(true);
      setError(getMfaErrorMessage(verifyError));
      setIsSubmitting(false);
      return;
    }

    setBackupCodes(generateBackupCodes());
    setStep(3);
    setIsSubmitting(false);
    void refreshStatus();
  };

  /**
   * Unenrolls every verified TOTP factor and refreshes status. The caller is
   * expected to have confirmed intent (e.g. via `showConfirm`) beforehand.
   */
  const handleDisable = useCallback(async () => {
    if (isDisabling) return;
    setError('');
    setIsDisabling(true);
    try {
      const targets =
        verifiedFactors.length > 0 ? verifiedFactors : await refreshStatus();
      for (const factor of targets) {
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({
          factorId: factor.id
        });
        if (unenrollError) {
          if (isMfa422Error(unenrollError)) setIsMfaUnavailable(true);
          setError(getMfaErrorMessage(unenrollError));
          return;
        }
      }
      // Reset the setup flow so a future re-enable starts clean.
      setStep(1);
      setTotpUri(null);
      setSecret(null);
      setVerifyCode('');
      setBackupCodes([]);
      await refreshStatus();
    } finally {
      setIsDisabling(false);
    }
  }, [isDisabling, verifiedFactors, refreshStatus]);

  return {
    totpUri,
    secret,
    verifyCode,
    setVerifyCode,
    backupCodes,
    error,
    step,
    isSubmitting,
    isMfaUnavailable,
    status,
    verifiedFactors,
    isDisabling,
    handleSetupStart,
    handleVerify,
    handleDisable,
    refreshStatus
  };
}
