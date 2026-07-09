// Tier thresholds are wired up but not live yet — supporterMonthlyUsd is not yet fed by real donations, so this always resolves to the Free tier for now.

// Types
export type MembershipTierId =
  | 'none'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'patron';
export type MembershipTone =
  | 'muted'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'patron';

export interface MembershipTier {
  id: MembershipTierId;
  label: string;
  description: string;
  minMonthlyUsd: number;
  tone: MembershipTone;
}

// Constants
const NO_TIER: MembershipTier = {
  id: 'none',
  label: 'Free',
  description: 'Every core feature, forever free.',
  minMonthlyUsd: 0,
  tone: 'muted'
};

export const MEMBERSHIP_TIERS: readonly MembershipTier[] = [
  NO_TIER,
  {
    id: 'gold',
    label: 'Gold Supporter',
    description: 'Up to $5 / month in support.',
    minMonthlyUsd: 0.01,
    tone: 'gold'
  },
  {
    id: 'platinum',
    label: 'Platinum Supporter',
    description: 'Up to $50 / month in support.',
    minMonthlyUsd: 5.01,
    tone: 'platinum'
  },
  {
    id: 'diamond',
    label: 'Diamond Supporter',
    description: 'Up to $100 / month in support.',
    minMonthlyUsd: 50.01,
    tone: 'diamond'
  },
  {
    id: 'patron',
    label: 'Patron',
    description: 'Above $100 / month — our top tier of support.',
    minMonthlyUsd: 100.01,
    tone: 'patron'
  }
];

// Helpers
export function getMembershipTier(monthlyUsd: number): MembershipTier {
  if (!Number.isFinite(monthlyUsd) || monthlyUsd <= 0) return NO_TIER;
  return (
    [...MEMBERSHIP_TIERS]
      .reverse()
      .find((t) => monthlyUsd >= t.minMonthlyUsd) ?? NO_TIER
  );
}
