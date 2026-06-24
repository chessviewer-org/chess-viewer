import assert from 'node:assert/strict';
import test from 'node:test';

import { getSlots, MAX_VISIBLE_DOTS, type Slot } from './getSlots.ts';

const dots = (slots: Slot[]) =>
  slots.filter((s): s is Extract<Slot, { kind: 'dot' }> => s.kind === 'dot');
const ellipses = (slots: Slot[]) => slots.filter((s) => s.kind === 'ellipsis');
const activePage = (slots: Slot[]) =>
  dots(slots).find((d) => d.tone === 'active')?.page;

test('renders one dot per page when the count fits the window', () => {
  const slots = getSlots(2, MAX_VISIBLE_DOTS);
  assert.equal(dots(slots).length, MAX_VISIBLE_DOTS);
  assert.equal(ellipses(slots).length, 0);
  assert.deepEqual(
    dots(slots).map((d) => d.page),
    [0, 1, 2, 3, 4, 5, 6]
  );
});

test('marks exactly the active page', () => {
  const slots = getSlots(3, 5);
  assert.equal(dots(slots).filter((d) => d.tone === 'active').length, 1);
  assert.equal(activePage(slots), 3);
});

test('never renders more than MAX_VISIBLE_DOTS dots once it overflows', () => {
  for (let page = 0; page < 50; page++) {
    const slots = getSlots(page, 50);
    assert.ok(
      dots(slots).length <= MAX_VISIBLE_DOTS,
      `page ${page} rendered ${dots(slots).length} dots`
    );
  }
});

test('keeps the active page inside the visible window for every page', () => {
  for (let page = 0; page < 50; page++) {
    const slots = getSlots(page, 50);
    assert.equal(activePage(slots), page, `active lost at page ${page}`);
  }
});

test('shows only a trailing ellipsis on the first page', () => {
  const slots = getSlots(0, 20);
  const e = ellipses(slots);
  assert.equal(e.length, 1);
  assert.equal(e[0]?.side, 'end');
  assert.equal(dots(slots)[0]?.page, 0);
});

test('shows only a leading ellipsis on the last page', () => {
  const last = 19;
  const slots = getSlots(last, 20);
  const e = ellipses(slots);
  assert.equal(e.length, 1);
  assert.equal(e[0]?.side, 'start');
  assert.equal(dots(slots).at(-1)?.page, last);
});

test('shows ellipses on both sides in the middle', () => {
  const slots = getSlots(10, 20);
  const sides = ellipses(slots).map((e) => e.side);
  assert.deepEqual(sides, ['start', 'end']);
});

test('fades the window edges but not the active dot when overflowing', () => {
  const slots = getSlots(10, 20);
  const d = dots(slots);
  assert.equal(d[0]?.tone, 'faded');
  assert.equal(d.at(-1)?.tone, 'faded');
  assert.equal(activePage(slots), 10);
});

test('handles a single page without an active marker context error', () => {
  const slots = getSlots(0, 1);
  assert.equal(dots(slots).length, 1);
  assert.equal(slots[0]?.kind === 'dot' && slots[0].tone, 'active');
});
