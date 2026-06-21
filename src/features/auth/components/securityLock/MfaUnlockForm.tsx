import { ArrowLeft } from 'lucide-react';

/** Props for {@link MfaUnlockForm}. */
export interface MfaUnlockFormProps {
  totpCode: string;
  setTotpCode: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}

/** Six-digit TOTP entry form for the security re-verification flow. */
export function MfaUnlockForm({
  totpCode,
  setTotpCode,
  isSubmitting,
  onSubmit,
  onBack
}: MfaUnlockFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          6-Digit Code
        </label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="000000"
          maxLength={6}
          className="w-full text-center text-lg tracking-[0.2em] font-mono rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-text-primary outline-none transition-colors duration-200"
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value.replace(/\\D/g, ''))}
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
        onClick={onBack}
        className="flex items-center justify-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors mt-2"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Password
      </button>
    </form>
  );
}
