import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
  getCachedPieceStyle,
  getPieceImages,
  preloadPieceStyle
} from '../src/shared/utils/pieceUtils';

const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
afterEach(() => {
  if (originalImage) Object.defineProperty(globalThis, 'Image', originalImage);
  else Reflect.deleteProperty(globalThis, 'Image');
});

function images() {
  const created: FakeImage[] = [];
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';
    constructor() {
      created.push(this);
    }
  }
  Object.defineProperty(globalThis, 'Image', {
    configurable: true,
    value: FakeImage
  });
  return created;
}

test('board placeholders and concurrent loaders share one image per source', async () => {
  const created = images();
  const pieces = { wK: '', bK: '' };
  const placeholders = getPieceImages('shared-test', pieces);
  const first = preloadPieceStyle('shared-test', pieces);
  const second = preloadPieceStyle('shared-test', pieces);
  assert.equal(created.length, 2);
  created.forEach((image) => image.onload?.());
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a['wK'], placeholders['wK']);
  assert.equal(a['bK'], b['bK']);
  assert.equal(getCachedPieceStyle('shared-test', pieces)?.['wK'], a['wK']);
  await preloadPieceStyle('shared-test', pieces);
  assert.equal(created.length, 2);
});

test('cancelling a consumer does not cancel shared artwork for another consumer', async () => {
  const created = images();
  const controller = new AbortController();
  const cancelled = preloadPieceStyle(
    'cancel-test',
    { wQ: '' },
    controller.signal
  );
  const active = preloadPieceStyle('cancel-test', { wQ: '' });
  controller.abort();
  created[0]!.onload?.();
  assert.deepEqual(await cancelled, {});
  assert.ok((await active)['wQ']);
  const alreadyAborted = await preloadPieceStyle(
    'unused-test',
    { wK: '' },
    controller.signal
  );
  assert.deepEqual(alreadyAborted, {});
  assert.equal(created.length, 1);
});

test('failed artwork is retryable rather than permanently cached', async () => {
  const created = images();
  const first = preloadPieceStyle('retry-test', { wP: '' });
  created[0]!.onerror?.();
  assert.deepEqual(await first, {});
  assert.equal(getCachedPieceStyle('retry-test', { wP: '' }), null);
  const retry = preloadPieceStyle('retry-test', { wP: '' });
  assert.equal(created.length, 2);
  created[1]!.onload?.();
  assert.ok((await retry)['wP']);
});

test('style-independent named letters share their decoded image across sets', async () => {
  const created = images();
  const first = preloadPieceStyle('letters-a', { 'w@WR': '' });
  const second = preloadPieceStyle('letters-b', { 'w@WR': '' });
  assert.equal(created.length, 1);
  created[0]!.onload?.();
  assert.equal((await first)['w@WR'], (await second)['w@WR']);
});
