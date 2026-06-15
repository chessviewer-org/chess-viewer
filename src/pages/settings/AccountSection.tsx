import { memo, useEffect, useRef, useState } from 'react';

import {
  CalendarDays,
  Check,
  Clock,
  Crown,
  Gem,
  Heart,
  KeyRound,
  LogIn,
  Mail,
  Pencil,
  ShieldAlert,
  Sparkles,
  Trash2,
  User as UserIcon,
  X
} from 'lucide-react';

import { useModal } from '@/contexts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/auth/hooks/useProfile';
import {
  type MembershipTier,
  type MembershipTone
} from '@/features/auth/services/membership';
import { profileService } from '@/features/auth/services/profileService';
import { supabase } from '@/features/auth/services/supabaseClient';

import { logger } from '@utils/logger';
import { sanitizeInput } from '@utils/validation';

const DONATE_URL = 'https://github.com/sponsors/chessvision-org';
const MAX_DISPLAY_NAME = 60;
const MAX_EMAIL = 320;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * Account section: an editable identity header (inline display-name edit + email
 * change), an amount-derived membership tier inside Account details, and the
 * account-level destructive actions. Email changes go through
 * supabase.auth.updateUser (which sends a confirmation email) and mirror onto
 * the relational profile row. Renders a guest prompt when no session exists.
 */
const AccountSection = memo(function AccountSection() {
  const { user, isAuthenticated } = useAuth();
  const { displayName, avatarUrl, setDisplayName, membershipTier, loading } =
    useProfile();
  const { showAlert } = useModal();

  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-4 animate-pageEnter">
        <SectionHeading icon={UserIcon} title="Account" />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-elevated p-8 text-center">
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

  const createdAt = formatDateTime(user.created_at);
  const lastSignInAt = formatDateTime(user.last_sign_in_at);
  const provider = formatProvider(user.app_metadata?.provider);

  return (
    <div className="space-y-5 animate-pageEnter">
      <SectionHeading icon={UserIcon} title="Account" />

      <IdentityHeader
        displayName={displayName}
        avatarUrl={avatarUrl}
        email={user.email ?? ''}
        loading={loading}
        onSaveName={setDisplayName}
      />

      <EmailCard
        userId={user.id}
        currentEmail={user.email ?? ''}
        showAlert={showAlert}
      />

      <AccountDetails
        provider={provider}
        createdAt={createdAt}
        lastSignInAt={lastSignInAt}
        tier={membershipTier}
      />

      <AccountActions />
    </div>
  );
});

/** Avatar + name + email, with an inline edit affordance for the display name. */
function IdentityHeader({
  displayName,
  avatarUrl,
  email,
  loading,
  onSaveName
}: {
  displayName: string;
  avatarUrl: string | null;
  email: string;
  loading: boolean;
  onSaveName: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the draft whenever editing opens or the upstream name resolves.
  useEffect(() => {
    if (editing) {
      setDraft(displayName);
      inputRef.current?.focus();
    }
  }, [editing, displayName]);

  const trimmed = sanitizeInput(draft).slice(0, MAX_DISPLAY_NAME).trim();
  const canSave = trimmed.length > 0 && trimmed !== displayName;

  const commit = () => {
    if (canSave) onSaveName(trimmed);
    setEditing(false);
  };
  const cancel = () => setEditing(false);

  return (
    <section className="flex items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-5">
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

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="account-display-name" className="sr-only">
              Display name
            </label>
            <input
              ref={inputRef}
              id="account-display-name"
              type="text"
              value={draft}
              maxLength={MAX_DISPLAY_NAME}
              disabled={loading}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') cancel();
              }}
              placeholder="Your name"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={commit}
                disabled={!canSave}
                aria-label="Save display name"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Save
              </button>
              <button
                type="button"
                onClick={cancel}
                aria-label="Cancel editing display name"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="truncate text-base font-bold text-text-primary">
              {displayName || 'ChessVision user'}
            </p>
            <p className="truncate text-sm text-text-secondary">{email}</p>
          </>
        )}
      </div>

      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit display name"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </button>
      )}
    </section>
  );
}

/** Change-email card. Updates Supabase auth (sends confirmation) + the profile row. */
function EmailCard({
  userId,
  currentEmail,
  showAlert
}: {
  userId: string;
  currentEmail: string;
  showAlert: (title: string, message: string, type?: 'info' | 'danger') => void;
}) {
  const [draft, setDraft] = useState(currentEmail);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setDraft(currentEmail);
  }, [currentEmail]);

  const next = draft.trim().slice(0, MAX_EMAIL);
  const valid = EMAIL_RE.test(next);
  const isDirty = valid && next.toLowerCase() !== currentEmail.toLowerCase();

  const handleSubmit = async () => {
    if (!isDirty || submitting) return;
    setSubmitting(true);
    try {
      // Authoritative change via Supabase auth — this dispatches a confirmation
      // email to the NEW address; the change only lands once confirmed.
      const { error } = await supabase.auth.updateUser({ email: next });
      if (error) throw error;
      // Mirror onto the relational profile row immediately (best-effort).
      await profileService.updateEmail(userId, next);
      showAlert(
        'Confirm your new email',
        `We sent a confirmation link to ${next}. Your email changes once you click that link. Until then you keep signing in with your current address.`,
        'info'
      );
    } catch (error) {
      logger.warn('Email update failed:', error);
      showAlert(
        'Could not update email',
        'Something went wrong updating your email. Please try again in a moment.',
        'danger'
      );
      setDraft(currentEmail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="account-email"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary"
        >
          <Mail className="h-4 w-4 text-text-muted" aria-hidden="true" />
          Email Address
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="account-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={draft}
            maxLength={MAX_EMAIL}
            disabled={submitting}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSubmit();
            }}
            placeholder="you@example.com"
            aria-invalid={draft.length > 0 && !valid}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!isDirty || submitting}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Update Email'}
          </button>
        </div>
      </div>
      <p className="text-xs text-text-muted">
        Changing your email sends a confirmation link to the new address. The
        change takes effect only after you confirm it.
      </p>
    </section>
  );
}

/** Account-details list with the membership tier row appended. */
function AccountDetails({
  provider,
  createdAt,
  lastSignInAt,
  tier
}: {
  provider: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  tier: MembershipTier;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface-elevated divide-y divide-border/60">
      <h3 className="px-5 pt-5 pb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
        Account Details
      </h3>
      <MembershipRow tier={tier} />
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
  );
}

const TONE_BADGE: Record<MembershipTone, string> = {
  muted: 'border-border bg-surface text-text-secondary',
  gold: 'border-warning/30 bg-warning/10 text-warning',
  platinum: 'border-info/30 bg-info/10 text-info',
  diamond: 'border-accent/30 bg-accent/10 text-accent',
  patron: 'border-accent/40 bg-accent/15 text-accent'
};

const TONE_ICON: Record<MembershipTone, typeof Heart> = {
  muted: Heart,
  gold: Sparkles,
  platinum: ShieldAlert,
  diamond: Gem,
  patron: Crown
};

/** Membership tier row — shows the tier badge, or a Donate CTA for the free tier. */
function MembershipRow({ tier }: { tier: MembershipTier }) {
  const Icon = tier.id === 'none' ? Heart : TONE_ICON[tier.tone];
  return (
    <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
        Membership
      </span>
      {tier.id === 'none' ? (
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
        >
          <Heart className="h-3.5 w-3.5" aria-hidden="true" />
          Donate now
        </a>
      ) : (
        <span
          title={tier.description}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${TONE_BADGE[tier.tone]}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {tier.label}
        </span>
      )}
    </div>
  );
}

/**
 * Account-level sensitive actions, relocated here from Data Management and
 * renamed from "Danger Zone". Permanent deletion is support-handled today.
 */
function AccountActions() {
  return (
    <section className="rounded-2xl border border-error/20 bg-error/5 p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-error">
        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        Manage Account
      </h3>
      <p className="mb-4 text-xs text-text-secondary">
        Permanent account deletion isn&apos;t self-service yet. To erase your
        account and all associated cloud data, email us and we&apos;ll remove
        it. This cannot be undone.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Account deletion is handled by support — see the link"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-5 py-2.5 text-sm font-bold text-error/70"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete Account Forever
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

function SectionHeading({
  icon: Icon,
  title
}: {
  icon: typeof UserIcon;
  title: string;
}) {
  return (
    <h2 className="flex items-center gap-2.5 border-b border-border pb-3 font-display text-2xl font-bold text-text-primary">
      <Icon className="h-6 w-6 text-text-secondary" aria-hidden="true" />
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
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
        {label}
      </span>
      <span className="min-w-0 wrap-break-word text-right text-sm font-medium text-text-primary">
        {value}
      </span>
    </div>
  );
}

AccountSection.displayName = 'AccountSection';
export default AccountSection;
