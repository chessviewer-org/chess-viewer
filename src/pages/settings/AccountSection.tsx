import { memo, useEffect, useRef, useState } from 'react';

import {
  CalendarDays,
  Check,
  Clock,
  Copy,
  Fingerprint,
  KeyRound,
  LogIn,
  Mail,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  UserPlus,
  X
} from 'lucide-react';

import { useModal } from '@/contexts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProfile } from '@/features/auth/hooks/useProfile';
import type { MembershipTier } from '@/features/auth/services/membership';
import { MEMBERSHIP_TIERS } from '@/features/auth/services/membership';
import { supabase } from '@/features/auth/services/supabaseClient';
import Modal from '@/shared/ui/Modal/Modal';

import { sanitizeInput } from '@utils/validation';
import { EmailCard } from './account/EmailCard';
import { MembershipRow } from './account/MembershipRow';
import { SettingsHeading } from './parts';
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

/** * Account section: an editable identity header (inline display-name edit + email * change), an amount-derived membership tier inside Account details, and the * account-level destructive actions. Email changes go through * supabase.auth.updateUser (which sends a confirmation email) and mirror onto * the relational profile row. Renders a guest prompt when no session exists. */
const AccountSection = memo(function AccountSection() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { displayName, setDisplayName, membershipTier, loading } = useProfile();
  const { openAuthModal, showAlert } = useModal();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const createdAt = formatDateTime(user?.created_at);
  const lastSignInAt = formatDateTime(user?.last_sign_in_at);
  const provider = formatProvider(user?.app_metadata?.provider);

  return (
    <div className="space-y-5 animate-pageEnter">
      <SettingsHeading icon={UserIcon} title="Account" />
      <IdentityHeader
        displayName={displayName}
        email={user?.email ?? null}
        loading={loading}
        onSaveName={setDisplayName}
        isAuthenticated={isAuthenticated}
      />
      {isAuthenticated && (
        <EmailCard
          userId={user?.id ?? ''}
          currentEmail={user?.email ?? ''}
          showAlert={showAlert}
        />
      )}
      <AccountDetails
        provider={provider}
        createdAt={createdAt}
        lastSignInAt={lastSignInAt}
        tier={isAuthenticated ? membershipTier : MEMBERSHIP_TIERS[0]!}
        userId={user?.id ?? null}
        isAuthenticated={isAuthenticated}
      />
      {isAuthenticated ? (
        <>
          <AccountActions onDeleteClick={() => setShowDeleteModal(true)} />
          <DeleteAccountModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onDeleted={() => {
              setShowDeleteModal(false);
              signOut();
            }}
          />
        </>
      ) : (
        <section className="rounded-2xl border border-success/20 bg-success/5 p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-success">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Cloud Synchronization
          </h3>
          <p className="mb-4 text-sm text-text-secondary leading-relaxed">
            Create a ChessVision account to sync your boards, history, and
            custom themes across all your devices. Your current local data will
            be automatically migrated to the cloud.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="inline-flex items-center gap-2 rounded-xl bg-success px-5 py-2.5 text-sm font-bold text-bg transition-colors hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add Account & Sync Now
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('signin')}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign In
            </button>
          </div>
        </section>
      )}
    </div>
  );
});

/** User identity header with an inline edit affordance for the display name. */
function IdentityHeader({
  displayName,
  email,
  loading,
  onSaveName,
  isAuthenticated
}: {
  displayName: string;
  email: string | null;
  loading: boolean;
  onSaveName: (name: string) => void;
  isAuthenticated: boolean;
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
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent font-bold text-lg uppercase">
        {displayName ? (
          displayName.charAt(0)
        ) : (
          <UserIcon className="h-7 w-7" aria-hidden="true" />
        )}
      </div>
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
              {displayName ||
                (isAuthenticated ? 'ChessVision user' : 'Local user')}
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

/** Account-details list with the membership tier row and support identity info. */
function AccountDetails({
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
      {!isAuthenticated ? (
        <CopyRow
          icon={ShieldCheck}
          label="Support Verification ID"
          value="Not Applicable"
        />
      ) : (
        <CopyRow
          icon={ShieldCheck}
          label="Support Verification ID"
          value={supportToken}
        />
      )}
    </section>
  );
}

/** A detail row whose value can be copied to the clipboard (e.g. for support). */
function CopyRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — no-op.
    }
  };
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className="h-4 w-4 text-text-muted" aria-hidden="true" />
        {label}
      </span>
      <button
        type="button"
        onClick={() => void handleCopy()}
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

/** * Account-level sensitive actions. */
function AccountActions({ onDeleteClick }: { onDeleteClick: () => void }) {
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

/** * Re-authentication modal for account deletion. Requires password and * 2FA (if enabled) before calling the deletion RPC. */
function DeleteAccountModal({
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

  // Check if MFA is active for this user.
  const isMfaActive = (user?.factors ?? []).some(
    (f) => f.status === 'verified'
  );

  const handleDelete = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Re-authenticate with password to verify ownership.
      const { error: authError, data: authData } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password
        });
      if (authError) {
        throw new Error('Invalid password. Please try again.');
      }

      // 2. MFA Check (if verified factors exist).
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

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: factor.id,
          challengeId: challenge.id,
          code: mfaCode
        });
        if (verifyError) {
          throw new Error('Invalid MFA code.');
        }
      }

      // 3. Final Deletion — call the SECURITY DEFINER RPC.
      const { error: rpcError } = await supabase.rpc('delete_own_account');
      if (rpcError) throw rpcError;

      // 4. Success — clear local data (optional but good practice) and notify parent.
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
      title="Delete Account Forever"
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
