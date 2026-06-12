import { ShieldCheck } from 'lucide-react';

import type { VerifiedFactor } from './useTwoFactorSetup';

/** Props for the enabled-state panel shown when a verified TOTP factor exists. */
interface TwoFactorEnabledProps {
  factors: VerifiedFactor[];
  isDisabling: boolean;
  onDisable: () => void;
}

/** Formats an ISO timestamp to a short readable date, or null when absent/invalid. */
function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function TwoFactorEnabled({
  factors,
  isDisabling,
  onDisable
}: TwoFactorEnabledProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/10 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/15">
          <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary">
            Two-factor authentication is on
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Your account requires a one-time passcode from your authenticator
            app at sign-in.
          </p>
        </div>
      </div>

      {factors.length > 0 && (
        <ul className="flex flex-col gap-2">
          {factors.map((factor) => {
            const added = formatDate(factor.createdAt);
            return (
              <li
                key={factor.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2.5"
              >
                <span className="min-w-0 break-all text-sm font-medium text-text-primary">
                  {factor.friendlyName || 'Authenticator app'}
                </span>
                {added && (
                  <span className="text-xs text-text-muted">Added {added}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onDisable}
        disabled={isDisabling}
        className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-error/30 bg-error/10 px-4 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDisabling ? 'Disabling…' : 'Disable 2FA'}
      </button>
    </div>
  );
}
