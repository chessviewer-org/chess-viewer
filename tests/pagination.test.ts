import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getNumberSlots } from '../src/shared/ui/Pagination/getSlots.ts';

test('numbered pagination shows the first two and last two pages with an ellipsis', () => {
  for (const count of [5, 7]) {
    assert.deepEqual(
      getNumberSlots(0, count).map((slot) =>
        slot.kind === 'dot' ? slot.page + 1 : '…'
      ),
      [1, 2, '…', count - 1, count]
    );
  }
});

test('numbered pagination keeps the current page and boundaries within five slots', () => {
  for (let count = 2; count <= 30; count++) {
    for (let page = 0; page < count; page++) {
      const slots = getNumberSlots(page, count);
      const pages = slots.flatMap((slot) =>
        slot.kind === 'dot' ? [slot.page] : []
      );
      assert.ok(slots.length <= 5);
      assert.equal(pages[0], 0);
      assert.equal(pages.at(-1), count - 1);
      assert.ok(pages.includes(page));
      assert.deepEqual(
        pages,
        [...new Set(pages)].sort((a, b) => a - b)
      );
      if (count < 5) assert.equal(pages.length, count);
    }
  }
});
