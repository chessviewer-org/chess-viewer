import { renderSVG } from 'uqr';
import {
  ShieldCheck,
  Download,
  AlertTriangle,
  Loader2,
  Copy,
  Check
} from '@/assets/icons';

export function LoadingCard() {
  return (
    <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-xl border border-border bg-surface shadow-sm">
      <Loader2 className="w-8 h-8 animate-spin text-accent" />
      <p className="text-sm text-text-secondary">Checking security status...</p>
    </div>
  );
}

export function EnabledCard({
  isDisabling,
  onDisable
}: {
  isDisabling: boolean;
  onDisable: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 rounded-xl border border-border bg-surface p-8 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success ring-8 ring-success/5">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <div className="text-center space-y-2 max-w-sm">
        <h3 className="text-lg font-bold text-text-primary">2FA is Enabled</h3>
        <p className="text-sm text-text-secondary">
          Your account is protected by two-factor authentication.
        </p>
      </div>
      <button
        onClick={onDisable}
        disabled={isDisabling}
        className="rounded-lg bg-error/10 px-6 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/20 active:scale-95 disabled:opacity-50"
      >
        {isDisabling ? 'Disabling...' : 'Disable 2FA'}
      </button>
    </div>
  );
}

export function SetupStartCard({
  isSubmitting,
  isMfaUnavailable,
  onStart
}: {
  isSubmitting: boolean;
  isMfaUnavailable: boolean;
  onStart: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-4">
        <div className="icon-circle">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-text-secondary">
            Add an extra layer of security to your account.
          </p>
        </div>
      </div>
      <button
        onClick={onStart}
        disabled={isSubmitting || isMfaUnavailable}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {isSubmitting ? 'Starting...' : 'Set up 2FA'}
      </button>
    </div>
  );
}

export function ScanQrCard({
  totpUri,
  secret,
  verifyCode,
  isSubmitting,
  onCodeChange,
  onVerify
}: {
  totpUri: string;
  secret: string | null;
  verifyCode: string;
  isSubmitting: boolean;
  onCodeChange: (code: string) => void;
  onVerify: (e: React.FormEvent) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-center text-text-primary">
        Scan QR Code
      </h3>
      <p className="text-sm text-center text-text-secondary">
        Scan this code with your authenticator app (Google Authenticator, Authy,
        etc).
      </p>
      <div className="flex justify-center p-4 bg-white rounded-lg">
        <div
          dangerouslySetInnerHTML={{ __html: renderSVG(totpUri) }}
          style={{ width: 200, height: 200 }}
        />
      </div>
      {secret && (
        <div className="text-center space-y-2">
          <p className="text-xs text-text-secondary">
            Or enter this setup key manually:
          </p>
          <code className="bg-surface-elevated px-3 py-1.5 rounded text-sm font-mono tracking-wider">
            {secret}
          </code>
        </div>
      )}
      <form
        onSubmit={onVerify}
        className="space-y-4 pt-4 border-t border-border"
      >
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">
            Verification Code
          </label>
          <input
            type="text"
            maxLength={6}
            placeholder="000000"
            className="w-full text-center text-xl tracking-[0.3em] font-mono rounded-lg border border-border bg-surface-elevated px-4 py-3 text-text-primary outline-none focus:border-accent"
            value={verifyCode}
            onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || verifyCode.length !== 6}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-bg hover:bg-accent-hover disabled:opacity-50"
        >
          {isSubmitting ? 'Verifying...' : 'Verify and Enable'}
        </button>
      </form>
    </div>
  );
}

export function BackupCodesCard({
  backupCodes,
  copiedCode,
  onCopy,
  onDownload,
  onDone
}: {
  backupCodes: string[];
  copiedCode: string | null;
  onCopy: (code: string) => void;
  onDownload: () => void;
  onDone: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-6">
      <div className="flex flex-col items-center gap-3 text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-text-primary">
          Save Your Backup Codes
        </h3>
        <p className="text-sm text-text-secondary">
          If you lose access to your device, you can use these backup codes to
          sign in. Each code can only be used once.
        </p>
      </div>
      <div className="bg-surface-elevated rounded-xl p-6 border border-border">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-sm tracking-wider text-text-primary">
          {backupCodes.map((code) => (
            <div
              key={code}
              className="flex items-center justify-between group rounded hover:bg-bg px-2 py-1 -mx-2 transition-colors"
            >
              <span>{code}</span>
              <button
                onClick={() => onCopy(code)}
                className="text-text-secondary hover:text-accent transition-colors"
              >
                {copiedCode === code ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onDownload}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-surface-elevated border border-border px-4 py-3 text-sm font-semibold hover:border-text-secondary transition-colors"
      >
        <Download className="w-4 h-4" /> Download Codes
      </button>
      <button
        onClick={onDone}
        className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-bg hover:bg-accent-hover transition-colors"
      >
        I have saved them
      </button>
    </div>
  );
}
