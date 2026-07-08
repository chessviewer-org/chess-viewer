import { memo, useState } from 'react';
import { LogIn, User as UserIcon, UserPlus } from '@/assets/icons';
import { MEMBERSHIP_TIERS, useAuth } from '@/auth';
import { useModal } from '@contexts';
import { SettingsHeading } from './parts';
import {
  AccountActions,
  AccountDetails,
  DeleteAccountModal,
  EmailCard,
  IdentityHeader
} from './AccountSectionParts';

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

function formatProvider(provider: unknown): string | null {
  if (typeof provider !== 'string' || provider.length === 0) return null;
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

const AccountSection = memo(function AccountSection() {
  const { user, isAuthenticated, signOut } = useAuth();
  const {
    profile,
    setDisplayName,
    membershipTier,
    isLoading: loading
  } = useAuth();
  const displayName = profile.displayName;
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
            Create a ChessViewer account to sync your boards, history, and
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

AccountSection.displayName = 'AccountSection';

export default AccountSection;
