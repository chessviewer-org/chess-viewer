import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  SYNC_TRUNCATED_EVENT,
  type SyncTruncatedDetail
} from '../constants/syncConstants.ts';
import {
  emitSyncTruncation,
  mergeById,
  trimToSyncBudget
} from './historyUtils.ts';

// historyUtils imports SAFE_SYNC_PLAINTEXT_BUDGET from syncStorage, which pulls
// in the Supabase client + Web Crypto and cannot load under node:test. We mirror
// the value here and assert it stays in sync with the source so a future edit to
// the cap can't silently invalidate these budget tests.
const SAFE_SYNC_PLAINTEXT_BUDGET = 7_000;

test('SAFE_SYNC_PLAINTEXT_BUDGET mirror matches the source constant', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(
    join(here, '../../features/auth/services/syncStorage.ts'),
    'utf8'
  );
  const match = src.match(/SAFE_SYNC_PLAINTEXT_BUDGET\s*=\s*([\d_]+)/);
  assert.ok(
    match,
    'could not locate SAFE_SYNC_PLAINTEXT_BUDGET in syncStorage'
  );
  assert.equal(Number(match[1]?.replace(/_/g, '')), SAFE_SYNC_PLAINTEXT_BUDGET);
});

test('trimToSyncBudget keeps the whole list when under budget', () => {
  const entries = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const result = trimToSyncBudget(entries);
  assert.equal(result.dropped, 0);
  assert.deepEqual(result.kept, entries);
});

test('trimToSyncBudget keeps the list at exactly the budget', () => {
  // Pad a single entry so its JSON serialization lands exactly on the cap.
  const base = JSON.stringify([{ id: 1, p: '' }]).length;
  const pad = 'x'.repeat(SAFE_SYNC_PLAINTEXT_BUDGET - base);
  const entries = [{ id: 1, p: pad }];
  assert.equal(JSON.stringify(entries).length, SAFE_SYNC_PLAINTEXT_BUDGET);
  const result = trimToSyncBudget(entries);
  assert.equal(result.dropped, 0);
  assert.deepEqual(result.kept, entries);
});

test('trimToSyncBudget drops oldest (trailing) entries over budget', () => {
  // Each entry ~700 chars of payload; 20 entries blow past the 7000 cap.
  const entries = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    p: 'x'.repeat(700)
  }));
  const result = trimToSyncBudget(entries);
  assert.ok(result.dropped > 0, 'expected some entries dropped');
  assert.equal(result.kept.length + result.dropped, entries.length);
  assert.ok(
    JSON.stringify(result.kept).length <= SAFE_SYNC_PLAINTEXT_BUDGET,
    'kept prefix must fit the budget'
  );
  // Kept prefix is newest-first: the head is preserved, the tail is dropped.
  assert.deepEqual(result.kept, entries.slice(0, result.kept.length));
});

test('trimToSyncBudget drops everything when a single entry exceeds budget', () => {
  const entries = [{ id: 1, p: 'x'.repeat(SAFE_SYNC_PLAINTEXT_BUDGET + 100) }];
  const result = trimToSyncBudget(entries);
  assert.deepEqual(result.kept, []);
  assert.equal(result.dropped, 1);
});

test('mergeById unions distinct ids from both lists', () => {
  const primary = [{ id: 1, v: 'a' }];
  const secondary = [{ id: 2, v: 'b' }];
  const merged = mergeById(primary, secondary);
  assert.equal(merged.length, 2);
  assert.deepEqual(new Set(merged.map((e) => e.id)), new Set([1, 2]));
});

test('mergeById lets primary win on id collisions', () => {
  const primary = [{ id: 1, v: 'cloud' }];
  const secondary = [{ id: 1, v: 'local' }];
  const merged = mergeById(primary, secondary);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.v, 'cloud');
});

test('mergeById handles empty inputs', () => {
  assert.deepEqual(mergeById([], []), []);
  assert.deepEqual(mergeById([{ id: 1 }], []), [{ id: 1 }]);
  assert.deepEqual(mergeById([], [{ id: 2 }]), [{ id: 2 }]);
});

test('emitSyncTruncation dispatches an event with the drop count', () => {
  const events: SyncTruncatedDetail[] = [];
  const handler = (e: Event) => {
    events.push((e as CustomEvent<SyncTruncatedDetail>).detail);
  };
  // emitSyncTruncation calls window.dispatchEvent; provide a minimal shim.
  (globalThis as { window?: typeof globalThis }).window = globalThis;
  globalThis.addEventListener(SYNC_TRUNCATED_EVENT, handler);
  try {
    emitSyncTruncation('history', 3);
    assert.equal(events.length, 1);
    assert.deepEqual(events[0], { dataset: 'history', dropped: 3 });
  } finally {
    globalThis.removeEventListener(SYNC_TRUNCATED_EVENT, handler);
  }
});

test('emitSyncTruncation is a no-op when nothing was dropped', () => {
  const events: SyncTruncatedDetail[] = [];
  const handler = (e: Event) => {
    events.push((e as CustomEvent<SyncTruncatedDetail>).detail);
  };
  (globalThis as { window?: typeof globalThis }).window = globalThis;
  globalThis.addEventListener(SYNC_TRUNCATED_EVENT, handler);
  try {
    emitSyncTruncation('archive', 0);
    emitSyncTruncation('archive', -1);
    assert.equal(events.length, 0);
  } finally {
    globalThis.removeEventListener(SYNC_TRUNCATED_EVENT, handler);
  }
});
