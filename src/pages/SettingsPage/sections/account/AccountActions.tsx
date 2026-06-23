import { Mail, ShieldAlert, Trash2 } from 'lucide-react';

/**
 * Account-level sensitive actions.
 */
export function AccountActions({
  onDeleteClick
}: {
  onDeleteClick: () => void;
}) {
  return (
    <section className="rounded-2xl border border-error/20 bg-error/5 p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-error">
        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        Manage Account
      </h3>
      <p className="mb-4 text-xs text-text-secondary leading-relaxed">
        Permanently erase your account and all associated cloud data. This
        action is irreversible. If you prefer support-handled deletion, email us
        with your <span className="font-bold">Support Verification ID</span>.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onDeleteClick}
          className="inline-flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-5 py-2.5 text-sm font-bold text-error transition-colors hover:bg-error/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete Account
        </button>
        <a
          href="mailto:contact@chessvision.org?subject=Account%20deletion%20request"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Contact support to delete
        </a>
      </div>
    </section>
  );
}
