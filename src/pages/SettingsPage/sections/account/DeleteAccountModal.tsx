import { useState } from 'react';

import { supabase, useAuth } from '@/features/auth';

import { Modal } from '@shared/ui';

/**
 * Re-authentication modal for account deletion. Requires password and
 * 2FA (if enabled) before calling the deletion RPC.
 */
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
