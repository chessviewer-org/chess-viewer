import { useEffect, useState } from 'react';

import { History } from '@/assets/icons';

import { type SecurityEvent, securityEventsService } from '@/auth';

const EVENT_LABELS: Record<string, string> = {
  SECURITY_REFRESH: 'Security re-verified',
  RECOVERY_CODES_GENERATED: 'Recovery codes generated',
  RECOVERY_CODE_SUCCESS: 'Recovery code used',
  RECOVERY_CODE_FAILURE: 'Recovery code failed',
  MFA_ENABLED: 'Two-factor enabled',
  MFA_DISABLED: 'Two-factor disabled',
  LOGIN_SUCCESS: 'Successful sign-in',
  LOGIN_FAILURE: 'Failed sign-in attempt',
  PASSWORD_CHANGE: 'Password changed'
};

function formatEventTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function SecurityActivity({
  enabled,
  refreshSignal = 0
}: {
  enabled: boolean;
  refreshSignal?: number;
}) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void securityEventsService.recent(5).then((recent) => {
      if (!cancelled) setEvents(recent);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, refreshSignal]);

  return (
    <section className="rounded-2xl border border-border bg-surface-elevated p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-text-primary">
        <History className="h-4 w-4 text-text-muted" aria-hidden="true" />
        Recent Security Activity
      </h3>
      <p className="mb-3 text-xs text-text-secondary">
        The latest security-related events on your account.
      </p>
      {events.length === 0 ? (
        <p className="text-xs text-text-muted">No recent activity to show.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span className="text-text-primary">
                {EVENT_LABELS[event.eventType] ?? event.eventType}
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                {formatEventTime(event.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
