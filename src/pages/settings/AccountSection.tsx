import { memo, useEffect, useState } from 'react';

import {
  CalendarDays,
  Check,
  Clock,
  KeyRound,
  LogIn,
  Mail,
  User as UserIcon
} from 'lucide-react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/auth/hooks/useProfile';

import { sanitizeInput } from '@utils/validation';

const MAX_DISPLAY_NAME = 60;

/** Formats an ISO timestamp to a readable date-time, or null when absent/invalid. */
function formatDateTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Capitalizes a provider id (e.g. "google" → "Google", "email" → "Email"). */
function formatProvider(provider: unknown): string | null {
  if (typeof provider !== 'string' || provider.length === 0) return null;
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

/**
 * Account section: shows the signed-in user's real email (read-only) and an
 * editable display name backed by the shared profile state. The password is
 * never editable here — it is managed through the Security section's reset
 * flow. Renders a guest-friendly prompt when no session exists.
 */
const AccountSection = memo(function AccountSection() {
  const { user, isAuthenticated } = useAuth();
  const { displayName, avatarUrl, setDisplayName, loading } = useProfile();

  const [draftName, setDraftName] = useState(displayName);
  const [saved, setSaved] = useState(false);

  // Keep the draft in sync when the upstream profile resolves/changes (e.g. a
  // post-login fetch lands after first render).
  useEffect(() => {
    setDraftName(displayName);
  }, [displayName]);

  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-6 animate-pageEnter">
        <SectionHeading icon={UserIcon} title="Account" />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-10 text-center">
          <LogIn className="h-8 w-8 text-text-muted" aria-hidden="true" />
          <p className="font-semibold text-text-primary">
            You are browsing as a guest
          </p>
          <p className="max-w-sm text-sm text-text-secondary">
            Sign in to manage your account details and sync your settings across
            devices. Your local data stays on this browser.
          </p>
        </div>
      </div>
    );
  }

  const trimmed = sanitizeInput(draftName).slice(0, MAX_DISPLAY_NAME).trim();
  const isDirty = trimmed.length > 0 && trimmed !== displayName;

  const handleSave = () => {
    if (!isDirty) return;
    setDisplayName(trimmed);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const createdAt = formatDateTime(user.created_at);
  const lastSignInAt = formatDateTime(user.last_sign_in_at);
  const provider = formatProvider(user.app_metadata?.provider);

  return (
    <div className="space-y-8 animate-pageEnter">
      <SectionHeading icon={UserIcon} title="Account" />

      <section className="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-6">
        {avatarUrl ? (
          // Profile avatar URL comes from the trusted profiles table.
          <img
            src={avatarUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
            <UserIcon className="h-7 w-7" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-text-primary">
            {displayName || 'ChessVision user'}
          </p>
          <p className="truncate text-sm text-text-secondary">{user.email}</p>
        </div>
      </section>

      <section className="space-y-6 rounded-2xl border border-border bg-surface-elevated p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Email Address
          </label>
          <div className="flex items-center gap-2 text-text-primary">
            <Mail className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="font-medium break-all">{user.email}</span>
          </div>
          <p className="text-xs text-text-muted">
            Your email is used for sign-in and cannot be changed here.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="account-display-name"
            className="text-xs font-bold uppercase tracking-wider text-text-secondary"
          >
            Display Name
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="account-display-name"
              type="text"
              value={draftName}
              maxLength={MAX_DISPLAY_NAME}
              disabled={loading}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              placeholder="Your name"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saved ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
          <p className="text-xs text-text-muted">
            Shown across ChessVision. {MAX_DISPLAY_NAME} characters max.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface-elevated divide-y divide-border/60">
        <h3 className="px-6 pt-6 pb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
          Account Details
        </h3>
        {provider && (
          <InfoRow icon={KeyRound} label="Sign-in method" value={provider} />
        )}
        {createdAt && (
          <InfoRow icon={CalendarDays} label="Member since" value={createdAt} />
        )}
        {lastSignInAt && (
          <InfoRow icon={Clock} label="Last sign-in" value={lastSignInAt} />
        )}
      </section>
    </div>
  );
});

function SectionHeading({
  icon: Icon,
  title
}: {
  icon: typeof UserIcon;
  title: string;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-text-primary">
      <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
      {title}
    </h2>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3.5">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
        {label}
      </span>
      <span className="min-w-0 break-words text-right text-sm font-medium text-text-primary">
        {value}
      </span>
    </div>
  );
}

AccountSection.displayName = 'AccountSection';
export default AccountSection;
