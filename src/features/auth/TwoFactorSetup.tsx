import React, { useState } from 'react';
import { supabase } from './supabaseClient';

function isMfa422Error(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    Number((error as { status?: number }).status) === 422
  );
}

function getMfaErrorMessage(error: unknown): string {
  let msg = '2FA operation failed. Please try again.';
  if (error instanceof Error && error.message) {
    msg = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    msg = String((error as { message: unknown }).message);
  }

  if (isMfa422Error(error)) {
    // 422 can mean MFA is disabled, or email is not verified, etc.
    if (msg.toLowerCase().includes('email')) {
      return msg; // e.g. "User requires a verified email before enrolling in MFA"
    }
    return `2FA setup failed (${msg}). Please ensure MFA/TOTP is enabled in your Supabase project settings.`;
  }

  return msg;
}

export function TwoFactorSetup() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Start, 2: Verify, 3: Backup Codes
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isMfaUnavailable, setIsMfaUnavailable] = useState<boolean>(false);

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
      if (isMfa422Error(factorsError)) {
        setIsMfaUnavailable(true);
      }
      setError(factorsError ? getMfaErrorMessage(factorsError) : 'Failed to list 2FA factors.');
      setIsSubmitting(false);
      return;
    }

    const hasVerifiedTotp = factors.totp.some((factor) => factor.status === 'verified');
    if (hasVerifiedTotp) {
      setError('2FA is already enabled for this account.');
      setIsSubmitting(false);
      return;
    }

    const pendingTotp = factors.totp.find((factor) => factor.status === 'unverified');
    if (pendingTotp) {
      // Unenroll the pending factor to start fresh
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: pendingTotp.id
      });
      if (unenrollError) {
        setError('Failed to clear previous incomplete 2FA setup. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    });

    if (enrollError || !data) {
      if (isMfa422Error(enrollError)) {
        setIsMfaUnavailable(true);
      }
      setError(enrollError ? getMfaErrorMessage(enrollError) : 'Failed to enroll in 2FA.');
      setIsSubmitting(false);
      return;
    }

    if (data.type === 'totp') {
      setQrCode(data.totp.qr_code);
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

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError || !factors) {
      if (isMfa422Error(factorsError)) {
        setIsMfaUnavailable(true);
      }
      setError(factorsError ? getMfaErrorMessage(factorsError) : 'Failed to list 2FA factors.');
      setIsSubmitting(false);
      return;
    }

    const unverifiedFactor = factors.totp.find((factor) => factor.status === 'unverified');
    if (!unverifiedFactor) {
      setError('No active unverified TOTP factor found. Please restart the setup.');
      setStep(1);
      setIsSubmitting(false);
      return;
    }

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: unverifiedFactor.id
    });
    if (challengeError || !challengeData) {
      if (isMfa422Error(challengeError)) {
        setIsMfaUnavailable(true);
      }
      setError(challengeError ? getMfaErrorMessage(challengeError) : 'Failed to challenge 2FA factor.');
      setIsSubmitting(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: unverifiedFactor.id,
      challengeId: challengeData.id,
      code: normalizedCode
    });

    if (verifyError) {
      if (isMfa422Error(verifyError)) {
        setIsMfaUnavailable(true);
      }
      setError(getMfaErrorMessage(verifyError));
      setIsSubmitting(false);
      return;
    }

    // Upon success, generate 10 backup codes
    generateBackupCodes();
    setStep(3);
    setIsSubmitting(false);
  };

  const generateBackupCodes = () => {
    // Cryptographically secure random backup code generator
    const codes = Array.from({ length: 10 }, () => {
      const array = new Uint8Array(4);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    });
    
    setBackupCodes(codes);
    // In a real application, we would hash these codes and send them to a secure Edge Function
    // that updates the `user_security` table. For this demo we display them once to the user.
  };

  return (
    <div className="flex flex-col gap-4 w-full p-2">
      {error && <div className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 text-sm rounded-lg">{error}</div>}
      {isMfaUnavailable && (
        <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-sm rounded-lg">
          Supabase MFA is not enabled in this project. Repeated requests are paused.
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="text-text-secondary text-sm">
            Protect your account with an extra layer of security. Once configured, you'll be required to enter both your password and an authentication code from your mobile phone in order to sign in.
          </p>
          <button 
            onClick={handleSetupStart}
            disabled={isSubmitting || isMfaUnavailable}
            className="w-full bg-accent text-bg px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isMfaUnavailable ? '2FA Unavailable' : isSubmitting ? 'Please wait...' : 'Set up 2FA'}
          </button>
        </div>
      )}

      {step === 2 && qrCode && (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <p className="text-text-secondary text-sm">
            Scan the QR code below with your authenticator app (like Google Authenticator or Authy), then enter the 6-digit code.
          </p>
          
          <div className="flex justify-center bg-white p-4 rounded-xl border border-border shadow-inner">
            {/* Supabase returns SVG string for QR code, enforce white background for scanability */}
            <div dangerouslySetInnerHTML={{ __html: qrCode }} className="w-48 h-48" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">Verification Code</label>
            <input 
              type="text" 
              maxLength={6}
              className="w-full bg-surface-hover border border-border text-text-primary p-2.5 rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all font-mono tracking-widest text-center"
              value={verifyCode} 
              onChange={(e) => setVerifyCode(e.target.value)} 
              required 
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent text-bg px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-semibold shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Please wait...' : 'Verify and Enable'}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-green-500/10 text-green-500 text-sm rounded-lg font-medium border border-green-500/20">
            ✓ 2FA successfully enabled
          </div>
          <p className="text-text-primary font-medium text-sm">Save these backup codes in a secure place. They will only be shown once.</p>
          <div className="grid grid-cols-2 gap-2 bg-surface-hover p-4 rounded-xl border border-border">
            {backupCodes.map((code, index) => (
              <div key={index} className="font-mono text-sm text-text-primary bg-surface-elevated p-2 text-center rounded border border-border/50 shadow-sm">
                {code.slice(0, 4)}-{code.slice(4)}
              </div>
            ))}
          </div>
          <button 
            onClick={() => window.print()}
            className="w-full bg-surface-hover text-text-primary px-4 py-2.5 rounded-lg hover:bg-surface-elevated transition-colors font-medium border border-border"
          >
            Print Codes
          </button>
        </div>
      )}
    </div>
  );
}
