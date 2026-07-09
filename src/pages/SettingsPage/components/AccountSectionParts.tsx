import { useState, useRef, useEffect } from 'react';
import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  Fingerprint,
  Heart,
  KeyRound,
  LucideIcon,
  Mail,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
  User as UserIcon
} from '@/assets/icons';

import { MembershipTier, supabase, useAuth } from '@/auth';
import { CONTACT_EMAIL } from '@/pages/AboutPage/utils/aboutConstants';

import { MembershipBadge, Modal } from '@ui';

import { useCopyToClipboard } from '@hooks';
import { logger, sanitizeInput } from '@utils';

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
          href={`mailto:${CONTACT_EMAIL}?subject=Account%20deletion%20request`}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-ring"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          Contact support to delete
        </a>
      </div>
    </section>
  );
}

export function AccountDetails({
  provider,
  createdAt,
  lastSignInAt,
  tier,
  userId,
  isAuthenticated
}: {
  provider: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  tier: MembershipTier;
  userId: string | null;
  isAuthenticated: boolean;
}) {
  const supportToken = userId?.slice(0, 8).toUpperCase() ?? 'NOT_AVAILABLE';
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
      <CopyRow
        icon={Fingerprint}
        label="User ID"
        value={userId ?? 'Local Account'}
      />
      <CopyRow
        icon={ShieldCheck}
        label="Support Verification ID"
        value={isAuthenticated ? supportToken : 'Not Applicable'}
      />
    </section>
  );
}

function CopyRow({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  const [copied, copyValue] = useCopyToClipboard();
  const handleCopy = () => copyValue(value);
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
        {label}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-0.5 text-right font-mono text-xs text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        title="Copy to clipboard"
      >
        <span className="truncate">{value}</span>
        {copied ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
        ) : (
          <Copy
            className="h-3.5 w-3.5 shrink-0 text-text-muted"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}

export function DeleteAccountModal({
  isOpen,
  onClose,
  onDeleted
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMfaActive = (user?.factors ?? []).some(
    (f: { status: string }) => f.status === 'verified'
  );

  const handleDelete = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      const { error: authError, data: authData } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password
        });
      if (authError) {
        throw new Error('Invalid password. Please try again.');
      }

      if (isMfaActive) {
        const factor = authData.user?.factors?.find(
          (f) => f.status === 'verified'
        );
        if (!factor) throw new Error('MFA factor not found.');

        const { data: challenge, error: challengeError } =
          await supabase.auth.mfa.challenge({
            factorId: factor.id
          });
        if (challengeError) throw challengeError;

        if (!challenge) throw new Error('Challenge failed');
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: factor.id,
          challengeId: challenge.id,
          code: mfaCode
        });
        if (verifyError) {
          throw new Error('Invalid MFA code.');
        }
      }

      const { error: rpcError } = await supabase.rpc('delete_own_account');
      if (rpcError) throw rpcError;

      localStorage.clear();
      onDeleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Deletion failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Delete Account"
      type="danger"
      onConfirm={handleDelete}
      onCancel={onClose}
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          This is your last chance. Deleting your account will permanently
          remove all your saved boards, history, and preferences from the cloud.
        </p>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="del-password"
              className="block text-xs font-bold uppercase text-text-muted mb-1.5"
            >
              Current Password
            </label>
            <input
              id="del-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus-visible:border-error focus-visible:ring-2 focus-visible:ring-error/20"
            />
          </div>
          {isMfaActive && (
            <div>
              <label
                htmlFor="del-mfa"
                className="block text-xs font-bold uppercase text-text-muted mb-1.5"
              >
                2FA Verification Code
              </label>
              <input
                id="del-mfa"
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus-visible:border-error focus-visible:ring-2 focus-visible:ring-error/20"
              />
            </div>
          )}
          {error && (
            <p className="text-xs font-semibold text-error bg-error/10 p-3 rounded-lg">
              {error}
            </p>
          )}
          {loading && (
            <p className="text-center text-xs text-text-muted animate-pulse">
              Erase in progress...
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

const MAX_EMAIL = 320;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailCard({
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
      const { error } = await supabase.auth.updateUser({ email: next });
      if (error) throw error;
      await supabase.auth.updateUser({ email: next });
      showAlert(
        'Confirm your new email',
        `We sent a confirmation link to ${next}. Your email changes once you click that link. Until then you keep signing in with your current address.`,
        'info'
      );
    } catch (error: unknown) {
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
    <section className="space-y-3 card-elevated">
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
            className="input-field"
          />
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!isDirty || submitting}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-ring disabled:cursor-not-allowed disabled:opacity-50"
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

const MAX_DISPLAY_NAME = 60;

export function IdentityHeader({
  displayName,
  email,
  loading,
  onSaveName,
  isAuthenticated
}: {
  displayName: string;
  email: string | null;
  loading: boolean;
  onSaveName: (name: string) => Promise<void>;
  isAuthenticated: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(displayName);
      setSaveError(null);
      inputRef.current?.focus();
    }
  }, [editing, displayName]);

  const trimmed = sanitizeInput(draft).slice(0, MAX_DISPLAY_NAME).trim();
  const canSave = trimmed.length > 0 && trimmed !== displayName;
  const commit = async () => {
    if (!canSave) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveName(trimmed);
      setEditing(false);
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to save. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };
  const cancel = () => {
    setEditing(false);
    setSaveError(null);
  };

  return (
    <section className="flex items-center gap-4 card-elevated">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-lg uppercase">
        {displayName ? (
          displayName.charAt(0)
        ) : (
          <UserIcon className="h-7 w-7" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex flex-col gap-2">
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
                disabled={loading || saving}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void commit();
                  if (e.key === 'Escape') cancel();
                }}
                placeholder="Your name"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors duration-200 disabled:opacity-60"
              />
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void commit()}
                  disabled={!canSave || saving}
                  aria-label="Save display name"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg transition-colors hover:bg-accent-hover focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  disabled={saving}
                  aria-label="Cancel editing display name"
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            {saveError && <p className="text-xs text-error">{saveError}</p>}
          </div>
        ) : (
          <>
            <p className="truncate text-base font-bold text-text-primary">
              {displayName ||
                (isAuthenticated ? 'ChessViewer user' : 'Local user')}
            </p>
            {isAuthenticated && email ? (
              <p className="truncate text-sm text-text-secondary">{email}</p>
            ) : (
              <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-text-muted border border-border">
                Not synchronized
              </span>
            )}
          </>
        )}
      </div>
      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit display name"
          className="ml-auto shrink-0 rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
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

function MembershipRow({ tier }: { tier: MembershipTier }) {
  return (
    <div className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <Heart className="h-4 w-4 text-text-muted" aria-hidden="true" />
        Membership
      </span>
      <MembershipBadge tier={tier} />
    </div>
  );
}
