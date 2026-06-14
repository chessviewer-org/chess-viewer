/**
 * Membership tier model — the SINGLE source of truth for mapping a voluntary
 * monthly-donation amount (USD) to a display-only membership tier.
 *
 * IMPORTANT — no billing backend exists yet. There is no charge, no real
 * subscription, and no stored dollar amount on the server today (the `profiles`
 * table only tracks an expiring `supporter_until` window, see profileService).
 * This module is pure presentation logic: given a monthly amount it returns the
 * tier to render. The amount defaults to 0 (= no donation → a "Donate now"
 * call-to-action) and can later be sourced from a real profile field without
 * changing any UI. Tiers are NOT an entitlement gate — core features are free.
 */

/** Canonical tier ids, ordered from no-support to highest. */
export type MembershipTierId =
  | 'none'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'patron';

/** A tone backed by an existing `--color-*` token (no hardcoded colour). */
export type MembershipTone =
  | 'muted'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'patron';

/** Display metadata for a single membership tier. */
export interface MembershipTier {
  id: MembershipTierId;
  /** Human label shown in the Account details row. */
  label: string;
  /** Short blurb describing the tier. */
  description: string;
  /** Lower bound (inclusive) of the monthly USD amount that maps to this tier. */
  minMonthlyUsd: number;
  /** Tone used to pick token-backed badge classes in the UI. */
  tone: MembershipTone;
}

/**
 * Tier thresholds, ascending by `minMonthlyUsd`. Bands (per product spec):
 *   $0            → none      (Donate now CTA)
 *   $0.01–$5      → Gold
 *   $5.01–$50     → Platinum
 *   $50.01–$100   → Diamond
 *   > $100        → Patron    (top tier)
 */
/** The free / no-donation tier. Also the fallback when no band qualifies. */
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
] as const;

/**
 * Pure: derive the membership tier from a monthly USD donation amount.
 * Non-finite, negative, or zero amounts resolve to the `none` tier. The highest
 * band whose `minMonthlyUsd` the amount meets or exceeds wins.
 */
export function getMembershipTier(monthlyUsd: number): MembershipTier {
  if (!Number.isFinite(monthlyUsd) || monthlyUsd <= 0) return NO_TIER;
  // Walk descending so the highest qualifying band is returned first.
  for (let i = MEMBERSHIP_TIERS.length - 1; i >= 0; i -= 1) {
    const tier = MEMBERSHIP_TIERS[i];
    if (tier && monthlyUsd >= tier.minMonthlyUsd) return tier;
  }
  return NO_TIER;
}

/** True when the amount maps to any paid supporter tier (i.e. not `none`). */
export function isSupporterAmount(monthlyUsd: number): boolean {
  return getMembershipTier(monthlyUsd).id !== 'none';
}
