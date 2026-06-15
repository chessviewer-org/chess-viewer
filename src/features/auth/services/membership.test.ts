import assert from 'node:assert/strict';
import test from 'node:test';

import { getMembershipTier, isSupporterAmount } from './membership.ts';

test('zero or no donation resolves to the none tier', () => {
  assert.equal(getMembershipTier(0).id, 'none');
  assert.equal(isSupporterAmount(0), false);
});

test('negative and non-finite amounts resolve to none', () => {
  assert.equal(getMembershipTier(-5).id, 'none');
  assert.equal(getMembershipTier(Number.NaN).id, 'none');
  // Non-finite is treated as invalid input, not as the top tier.
  assert.equal(getMembershipTier(Number.POSITIVE_INFINITY).id, 'none');
});

test('maps band lower/upper edges to the documented tiers', () => {
  assert.equal(getMembershipTier(0.01).id, 'gold');
  assert.equal(getMembershipTier(5).id, 'gold');
  assert.equal(getMembershipTier(5.01).id, 'platinum');
  assert.equal(getMembershipTier(50).id, 'platinum');
  assert.equal(getMembershipTier(50.01).id, 'diamond');
  assert.equal(getMembershipTier(100).id, 'diamond');
  assert.equal(getMembershipTier(100.01).id, 'patron');
  assert.equal(getMembershipTier(1000).id, 'patron');
});

test('isSupporterAmount is true for any paid band', () => {
  assert.equal(isSupporterAmount(1), true);
  assert.equal(isSupporterAmount(250), true);
});
