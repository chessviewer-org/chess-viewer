import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

/** Type guard: checks if an unknown error has a numeric `status` property equal to 422. */
function isMfa422Error(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if (!('status' in error)) return false;
  const record = error as { status?: unknown; message?: unknown };
  return Number(record.status) === 422;
}

/** Extracts a user-friendly message from an unknown MFA error. */
function getMfaErrorMessage(error: unknown): string {
  let msg = '2FA operation failed. Please try again.';

  if (error instanceof Error && error.message) {
    msg = error.message;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    const record = error as { status?: unknown; message?: unknown };
    msg = String(record.message);
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
  const [totpUri, setTotpUri] = useState<string | null>(null);
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

    const unverifiedFactors = factors.totp.filter((factor) => (factor.status as string) === 'unverified');
    for (const factor of unverifiedFactors) {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factor.id
      });
      if (unenrollError) {
        setError('Failed to clear previous incomplete 2FA setup. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    const uniqueId = Math.random().toString(36).substring(2, 8);
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'ChessVision',
      friendlyName: user.email ? `${user.email} (${uniqueId})` : `ChessVision Auth (${uniqueId})`
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

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError || !factors) {
      if (isMfa422Error(factorsError)) {
        setIsMfaUnavailable(true);
      }
      setError(factorsError ? getMfaErrorMessage(factorsError) : 'Failed to list 2FA factors.');
      setIsSubmitting(false);
      return;
    }

    const unverifiedFactor = factors.totp.find((factor) => (factor.status as string) === 'unverified');
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
        <div className="flex flex-col items-center text-center gap-6 p-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-2 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-text-primary font-display">Two-Factor Authentication</h3>
            <p className="text-text-secondary text-sm leading-relaxed px-2">
              Protect your account with an extra layer of security. Once configured, you'll be required to enter both your password and an authentication code from your mobile device to sign in.
            </p>
          </div>
          <button 
            onClick={handleSetupStart}
            disabled={isSubmitting || isMfaUnavailable}
            className="w-full mt-2 bg-accent text-bg px-4 py-3.5 rounded-xl hover:bg-accent-hover transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isMfaUnavailable ? '2FA Unavailable' : isSubmitting ? 'Starting Setup...' : 'Begin Setup'}
          </button>
        </div>
      )}

      {step === 2 && totpUri && (
        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="flex flex-col items-center justify-center p-6 bg-surface-elevated/40 rounded-2xl border border-border/50 shadow-sm">
            <div className="text-center mb-6">
              <h3 className="text-base font-semibold text-text-primary mb-1">Scan QR Code</h3>
              <p className="text-text-secondary text-xs leading-relaxed max-w-65 mx-auto">
                Use an authenticator app (e.g. Google Auth, Authy, Aegis) to scan this code.
              </p>
            </div>
            
            <div className="relative bg-white p-4 rounded-[1.25rem] border border-white/20 shadow-[0_0_40px_-15px_rgba(255,255,255,0.15)] w-56 h-56 mx-auto mb-6 flex items-center justify-center">
              <QRCodeSVG 
                value={totpUri} 
                size={192} 
                level="M" 
                includeMargin={true}
                className="w-full h-full"
              />
            </div>

            {secret && (
              <div className="flex flex-col items-center justify-center gap-2 w-full">
                <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">OR MANUAL SETUP KEY</span>
                <div className="w-full bg-surface-primary border border-border/80 px-4 py-2.5 rounded-xl text-center shadow-inner">
                   <p className="font-mono text-text-primary text-[15px] font-medium tracking-[0.15em] break-all whitespace-nowrap overflow-hidden text-ellipsis">
                     {secret.match(/.{1,4}/g)?.join(' ') || secret}
                   </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary text-center">ENTER 6-DIGIT CODE</label>
            <div className="flex justify-center relative w-full" onClick={() => document.getElementById('verification-input')?.focus()}>
               <div className="flex items-center gap-2 sm:gap-3">
                 {[0, 1, 2, 3, 4, 5].map((i) => (
                   <div key={i} className={`w-11 h-14 sm:w-12 sm:h-16 flex items-center justify-center rounded-xl border-2 ${verifyCode.length === i ? 'border-accent ring-4 ring-accent/10 bg-surface-primary' : verifyCode[i] ? 'border-border bg-surface-primary text-text-primary' : 'border-border/40 bg-surface-elevated/50 text-text-muted'} shadow-sm text-2xl font-bold font-mono transition-all duration-200`}>
                     {verifyCode[i] || ''}
                   </div>
                 ))}
               </div>
               <input 
                 id="verification-input"
                 type="text" 
                 inputMode="numeric"
                 autoComplete="one-time-code"
                 maxLength={6}
                 className="absolute inset-0 opacity-0 cursor-text w-full h-full z-10"
                 value={verifyCode} 
                 onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} 
                 required 
               />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || verifyCode.length !== 6}
            className="w-full bg-accent text-bg px-4 py-3.5 rounded-xl hover:bg-accent-hover transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6 p-2">
          <div className="flex flex-col items-center text-center gap-4 mt-2">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center shadow-inner">
              <span className="text-3xl text-green-500">✓</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-text-primary font-display">2FA Enabled Successfully</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Save these backup codes in a secure place. They can be used to recover your account if you lose access to your authenticator app.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 bg-surface-primary p-5 rounded-2xl border border-border shadow-inner">
            {backupCodes.map((code) => (
              <div key={code} className="font-mono text-[13px] sm:text-sm text-text-primary bg-surface-elevated py-2.5 px-3 text-center rounded-xl border border-border/50 tracking-wider">
                {code.slice(0, 4)} {code.slice(4)}
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => window.print()}
            className="w-full mt-2 bg-surface-elevated text-text-primary px-4 py-3.5 rounded-xl hover:bg-surface-hover transition-all font-semibold border border-border shadow-sm active:scale-[0.98]"
          >
            Download / Print Codes
          </button>
        </div>
      )}
    </div>
  );
}
