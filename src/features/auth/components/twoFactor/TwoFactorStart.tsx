import { ShieldCheck } from 'lucide-react';

/** Props for the `TwoFactorStart` intro step. */
interface TwoFactorStartProps {
  isSubmitting: boolean;
  isMfaUnavailable: boolean;
  onStart: () => void;
}

export function TwoFactorStart({
  isSubmitting,
  isMfaUnavailable,
  onStart
}: TwoFactorStartProps) {
  return (
    <div className="flex flex-col items-center text-center gap-6 p-4">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-2 shadow-inner">
        <ShieldCheck className="w-8 h-8 text-text-secondary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-text-primary font-display">
          Two-Factor Authentication
        </h3>
        <p className="text-text-secondary text-sm leading-relaxed px-2">
          Protect your account with an extra layer of security. Once configured,
          you'll be required to enter both your password and an authentication
          code from your mobile device to sign in.
        </p>
      </div>
      <button
        onClick={onStart}
        disabled={isSubmitting || isMfaUnavailable}
        className="w-full mt-2 bg-accent text-bg px-4 py-3.5 rounded-xl hover:bg-accent-hover transition-colors duration-200 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {isMfaUnavailable
          ? '2FA Unavailable'
          : isSubmitting
            ? 'Starting Setup...'
            : 'Begin Setup'}
      </button>
    </div>
  );
}
