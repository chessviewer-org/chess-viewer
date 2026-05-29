import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ShieldAlert, ShieldCheck } from 'lucide-react';

import { supabase } from '../services/supabaseClient';
import type { SecurityLockModalProps } from '../types';

/**
 * Full-screen lock overlay requiring re-authentication after 90 days of inactivity.
 *
 * Supports password, TOTP, and backup-code verification flows. Rendered via a
 * portal so it sits above all other content.
 */
export function SecurityLockModal({ onUnlock }: SecurityLockModalProps) {
  const [password, setPassword] = useState<string>('');
  const [backupCode, setBackupCode] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [mode, setMode] = useState<'password' | 'backup' | 'mfa'>('password');
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

    // Check if MFA is enabled
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

  return createPortal(
    <div className="fixed inset-0 z-110 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-bg"
        aria-hidden="true"
      />

      {/* Card */}
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.05 }
        }}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
          <div className="w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center">
            {mode === 'mfa' ? (
              <ShieldAlert className="w-7 h-7 text-accent" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-warning" />
            )}
          </div>
          <h2 className="text-xl font-bold font-display text-text-primary">
            {mode === 'mfa'
              ? 'Two-Factor Authentication'
              : 'Security Verification Required'}
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed max-w-[320px]">
            {mode === 'mfa'
              ? 'Enter the 6-digit code from your authenticator app.'
              : 'It has been 90 days since your last security check. Please verify your identity to continue.'}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-8">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-lg border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode Tabs - Hidden in MFA mode */}
          {mode !== 'mfa' && (
            <div className="flex gap-2 mb-5 bg-surface-elevated p-1.5 rounded-xl border border-border">
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  mode === 'password'
                    ? 'bg-bg text-text-primary shadow-sm ring-1 ring-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => setMode('password')}
              >
                Password
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  mode === 'backup'
                    ? 'bg-bg text-text-primary shadow-sm ring-1 ring-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
                onClick={() => setMode('backup')}
              >
                Backup Code
              </button>
            </div>
          )}

          {mode === 'password' && (
            <form
              onSubmit={handlePasswordSubmit}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Current Password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/35 outline-none transition-colors duration-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-md transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Checking MFA...' : 'Continue'}
              </button>
            </form>
          )}

          {mode === 'mfa' && (
            <form onSubmit={handleMfaVerify} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  maxLength={6}
                  className="w-full text-center text-lg tracking-[0.2em] font-mono rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/35 outline-none transition-colors duration-200"
                  value={totpCode}
                  onChange={(e) =>
                    setTotpCode(e.target.value.replace(/\\D/g, ''))
                  }
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || totpCode.length !== 6}
                className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-md transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Unlock'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('password');
                  setTotpCode('');
                  setError('');
                }}
                className="flex items-center justify-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors mt-2"
              >
                <ArrowLeft className="w-3 h-3" />
                Back to Password
              </button>
            </form>
          )}

          {mode === 'backup' && (
            <form onSubmit={handleBackupSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Backup Code
                </label>
                <input
                  type="text"
                  placeholder="Enter an unused backup code"
                  className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/35 outline-none transition-colors duration-200 font-mono"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-md transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Verifying…' : 'Verify Identity'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
