import type { MembershipTier, MembershipTone } from '@/auth';

import { Crown, Gem, Heart, ShieldAlert, Sparkles } from '@/assets/icons';

const DONATE_URL = 'https://github.com/sponsors/chessviewer-org';

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

const TONE_TEXT: Record<MembershipTone, string> = {
  muted: 'text-text-secondary',
  gold: 'text-warning',
  platinum: 'text-info',
  diamond: 'text-accent',
  patron: 'text-accent'
};

interface MembershipBadgeProps {
  tier: MembershipTier;
  variant?: 'badge' | 'plain';
}

export function MembershipBadge({
  tier,
  variant = 'badge'
}: MembershipBadgeProps) {
  const Icon = tier.id === 'none' ? Heart : TONE_ICON[tier.tone];

  if (tier.id === 'none') {
    const plainClasses =
      'mt-1 flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors';
    const badgeClasses =
      'inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated';

    return (
      <a
        href={DONATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={variant === 'plain' ? plainClasses : badgeClasses}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        Donate now
      </a>
    );
  }

  if (variant === 'plain') {
    return (
      <span
        className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${TONE_TEXT[tier.tone]}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {tier.label}
      </span>
    );
  }

  return (
    <span
      title={tier.description}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${TONE_BADGE[tier.tone]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {tier.label}
    </span>
  );
}
