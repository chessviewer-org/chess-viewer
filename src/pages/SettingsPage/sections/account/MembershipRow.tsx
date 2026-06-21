import { Crown, Gem, Heart, ShieldAlert, Sparkles } from 'lucide-react';

import type { MembershipTier, MembershipTone } from '@/features/auth';

const DONATE_URL = 'https://github.com/sponsors/chessvision-org';

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
export function MembershipRow({ tier }: { tier: MembershipTier }) {
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
