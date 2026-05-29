import React from 'react';

import { QRCodeSVG } from 'qrcode.react';

/** Props for the `TwoFactorVerify` QR-code and TOTP entry step. */
interface TwoFactorVerifyProps {
  totpUri: string;
  secret: string | null;
  verifyCode: string;
  setVerifyCode: (v: string) => void;
  isSubmitting: boolean;
  onVerify: (e: React.FormEvent) => void;
}

export function TwoFactorVerify({
  totpUri,
  secret,
  verifyCode,
  setVerifyCode,
  isSubmitting,
  onVerify
}: TwoFactorVerifyProps) {
  return (
    <form onSubmit={onVerify} className="flex flex-col gap-6">
      <div className="flex flex-col items-center justify-center p-6 bg-surface-elevated/40 rounded-2xl border border-border/50 shadow-sm">
        <div className="text-center mb-6">
          <h3 className="text-base font-semibold text-text-primary mb-1">
            Scan QR Code
          </h3>
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
            <span className="text-[10px] uppercase tracking-widest font-bold text-text-secondary">
              OR MANUAL SETUP KEY
            </span>
            <div className="w-full bg-surface-primary border border-border/80 px-4 py-2.5 rounded-xl text-center shadow-inner">
              <p className="font-mono text-text-primary text-[15px] font-medium tracking-[0.15em] break-all whitespace-nowrap overflow-hidden text-ellipsis">
                {secret.match(/.{1,4}/g)?.join(' ') || secret}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-xs font-semibold uppercase tracking-widest text-text-secondary text-center">
          ENTER 6-DIGIT CODE
        </label>
        <div
          className="flex justify-center relative w-full"
          onClick={() => document.getElementById('verification-input')?.focus()}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-11 h-14 sm:w-12 sm:h-16 flex items-center justify-center rounded-xl border-2 ${
                  verifyCode.length === i
                    ? 'border-accent ring-4 ring-accent/10 bg-surface-primary'
                    : verifyCode[i]
                      ? 'border-border bg-surface-primary text-text-primary'
                      : 'border-border/40 bg-surface-elevated/50 text-text-muted'
                } shadow-sm text-2xl font-bold font-mono transition-colors duration-200`}
              >
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
        className="w-full bg-accent text-bg px-4 py-3.5 rounded-xl hover:bg-accent-hover transition-colors duration-200 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
      >
        {isSubmitting ? 'Verifying...' : 'Verify & Enable'}
      </button>
    </form>
  );
}
