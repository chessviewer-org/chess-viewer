/** Props for {@link BackupCodeUnlockForm}. */
export interface BackupCodeUnlockFormProps {
  backupCode: string;
  setBackupCode: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

/** Backup-code entry form for the security re-verification flow. */
export function BackupCodeUnlockForm({
  backupCode,
  setBackupCode,
  isSubmitting,
  onSubmit
}: BackupCodeUnlockFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Backup Code
        </label>
        <input
          type="text"
          placeholder="Enter an unused backup code"
          className="w-full rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 font-mono"
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
  );
}
