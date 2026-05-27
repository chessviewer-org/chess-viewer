/** Props for the `TwoFactorBackupCodes` success step. */
interface TwoFactorBackupCodesProps {
  backupCodes: string[];
}

export function TwoFactorBackupCodes({ backupCodes }: TwoFactorBackupCodesProps) {
  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex flex-col items-center text-center gap-4 mt-2">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center shadow-inner">
          <span className="text-3xl text-green-500">✓</span>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-text-primary font-display">
            2FA Enabled Successfully
          </h3>
          <p className="text-text-secondary text-sm leading-relaxed">
            Save these backup codes in a secure place. They can be used to recover your
            account if you lose access to your authenticator app.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 bg-surface-primary p-5 rounded-2xl border border-border shadow-inner">
        {backupCodes.map((code) => (
          <div
            key={code}
            className="font-mono text-[13px] sm:text-sm text-text-primary bg-surface-elevated py-2.5 px-3 text-center rounded-xl border border-border/50 tracking-wider"
          >
            {code.slice(0, 4)} {code.slice(4)}
          </div>
        ))}
      </div>

      <button
        onClick={() => window.print()}
        className="w-full mt-2 bg-surface-elevated text-text-primary px-4 py-3.5 rounded-xl hover:bg-surface-hover transition-colors duration-200 font-semibold border border-border shadow-sm active:scale-[0.98]"
      >
        Download / Print Codes
      </button>
    </div>
  );
}
