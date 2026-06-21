import {
  CalendarDays,
  Clock,
  Fingerprint,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

import type { MembershipTier } from '@/features/auth';

import { CopyRow } from './CopyRow';
import { InfoRow } from './InfoRow';
import { MembershipRow } from './MembershipRow';

/** Account-details list with the membership tier row and support identity info. */
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
