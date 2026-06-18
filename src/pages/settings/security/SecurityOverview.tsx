import { useEffect, useState } from 'react';

import { Clock, ShieldCheck, ShieldX } from 'lucide-react';

import { supabase } from '@/features/auth/services/supabaseClient';

import { logger } from '@utils/logger';

/** Formats an ISO timestamp to a readable date-time, or null when absent. */
function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * At-a-glance security status: whether two-factor is active (a verified TOTP
 * factor exists) and the last sign-in time. Read-only — probes MFA factors via
 * the singleton client on mount.
 */
export function SecurityOverview({
  lastSignInAt
}: {
  lastSignInAt: string | null | undefined;
}) {
  const [mfaActive, setMfaActive] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void supabase.auth.mfa
      .listFactors()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setMfaActive(false);
          return;
        }
        const verified = (data?.totp ?? []).some(
          (f) => f.status === 'verified'
        );
        setMfaActive(verified);
      })
      .catch((err) => {
        logger.warn('Failed to read MFA factors:', err);
        if (!cancelled) setMfaActive(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const lastSignIn = formatDateTime(lastSignInAt);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-4">
        {mfaActive ? (
          <ShieldCheck
            className="h-6 w-6 shrink-0 text-success"
            aria-hidden="true"
          />
        ) : (
          <ShieldX
            className="h-6 w-6 shrink-0 text-text-muted"
            aria-hidden="true"
          />
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Two-factor
          </p>
          <p className="text-sm font-semibold text-text-primary">
            {mfaActive === null
              ? 'Checking…'
              : mfaActive
                ? 'Enabled'
                : 'Not enabled'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-4">
        <Clock
          className="h-6 w-6 shrink-0 text-text-muted"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Last sign-in
          </p>
          <p className="truncate text-sm font-semibold text-text-primary">
            {lastSignIn ?? 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  );
}
