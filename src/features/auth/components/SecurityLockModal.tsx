import { useRef } from 'react';
import { createPortal } from 'react-dom';

import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

import { useFocusTrap } from '@hooks';

import type { SecurityLockModalProps } from '../types';
import { BackupCodeUnlockForm } from './securityLock/BackupCodeUnlockForm';
import { MfaUnlockForm } from './securityLock/MfaUnlockForm';
import { PasswordUnlockForm } from './securityLock/PasswordUnlockForm';
import { useSecurityUnlock } from './securityLock/useSecurityUnlock';

/**
 * Full-screen lock overlay requiring re-authentication after 90 days of inactivity.
 *
 * Supports password, TOTP, and backup-code verification flows. Rendered via a
 * portal so it sits above all other content. Verification logic lives in
 * {@link useSecurityUnlock}; each mode's form is a dedicated sub-component.
 */
export function SecurityLockModal({ onUnlock }: SecurityLockModalProps) {
  const {
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
  } = useSecurityUnlock(onUnlock);

  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-lock-title"
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
              <ShieldAlert className="w-7 h-7 text-text-secondary" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-warning" />
            )}
          </div>
          <h2
            id="security-lock-title"
            className="text-xl font-bold font-display text-text-primary"
          >
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
            <PasswordUnlockForm
              password={password}
              setPassword={setPassword}
              isSubmitting={isSubmitting}
              onSubmit={handlePasswordSubmit}
            />
          )}

          {mode === 'mfa' && (
            <MfaUnlockForm
              totpCode={totpCode}
              setTotpCode={setTotpCode}
              isSubmitting={isSubmitting}
              onSubmit={handleMfaVerify}
              onBack={() => {
                setMode('password');
                setTotpCode('');
                setError('');
              }}
            />
          )}

          {mode === 'backup' && (
            <BackupCodeUnlockForm
              backupCode={backupCode}
              setBackupCode={setBackupCode}
              isSubmitting={isSubmitting}
              onSubmit={handleBackupSubmit}
            />
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
