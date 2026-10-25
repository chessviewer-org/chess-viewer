import assert from 'node:assert/strict';
import { fetchPieceSvgText } from '../src/shared/utils/pieceSvg';
import { afterEach, beforeEach, test } from 'node:test';

import { inlinePieceSources } from '../src/shared/utils/pieceSources';
import {
  getCachedPieceStyle,
  getDisplayablePieceStyle,
  preloadPieceStyle
} from '../src/shared/utils/pieceUtils';
import { getSVGBlob } from '../src/shared/utils/svgExporter';

const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
const originalFetch = globalThis.fetch;
const originalLocation = Object.getOwnPropertyDescriptor(
  globalThis,
  'location'
);
const VECTOR =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="M0 0h45v45H0z"/></svg>';

beforeEach(() => {
  globalThis.fetch = async () => new Response(VECTOR);
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { href: 'https://pieces.test/' }
  });
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalImage) Object.defineProperty(globalThis, 'Image', originalImage);
  else Reflect.deleteProperty(globalThis, 'Image');
  if (originalLocation)
    Object.defineProperty(globalThis, 'location', originalLocation);
  else Reflect.deleteProperty(globalThis, 'location');
});

function images(failFirstDecode = false) {
  const created: FakeImage[] = [];
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    complete = false;
    naturalWidth = 0;
    naturalHeight = 0;
    private source = '';
    get src() {
      return this.source;
    }
    set src(value: string) {
      this.source = value;
      queueMicrotask(() => {
        if (failFirstDecode) {
          failFirstDecode = false;
          this.onerror?.();
        } else {
          this.complete = true;
          this.naturalWidth = this.naturalHeight = 45;
          this.onload?.();
        }
      });
    }
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

test('concurrent loaders share one image per source and publish only decoded images', async () => {
  const created = images();
  const pieces = { wK: '', bK: '' };
  const first = preloadPieceStyle('shared-test', pieces);
  const second = preloadPieceStyle('shared-test', pieces);
  assert.equal(created.length, 2);
  assert.deepEqual(getCachedPieceStyle('shared-test', pieces), {});
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a['wK'], b['wK']);
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
  const created = images(true);
  const first = preloadPieceStyle('retry-test', { wP: '' });
  assert.deepEqual(await first, {});
  assert.deepEqual(getCachedPieceStyle('retry-test', { wP: '' }), {});
  const retry = preloadPieceStyle('retry-test', { wP: '' });
  assert.equal(created.length, 2);
  assert.ok((await retry)['wP']);
});

test('style-independent named letters share their decoded image across sets', async () => {
  const created = images();
  const first = preloadPieceStyle('letters-a', { 'w@WR': '' });
  const second = preloadPieceStyle('letters-b', { 'w@WR': '' });
  assert.equal(created.length, 1);
  assert.equal((await first)['w@WR'], (await second)['w@WR']);
});

test('piece readiness includes fetching and retaining the original SVG', async (context) => {
  const created = images();
  let respond: ((response: Response) => void) | undefined;
  const request = new Promise<Response>((resolve) => (respond = resolve));
  const fetch = context.mock.method(globalThis, 'fetch', () => request);
  const pending = preloadPieceStyle('source-ready-test', { wK: '' });
  const firstImage = created[0];
  assert.ok(firstImage);
  assert.equal(firstImage.src, '');
  assert.deepEqual(getCachedPieceStyle('source-ready-test', { wK: '' }), {});
  assert.ok(respond);
  respond(new Response(VECTOR));
  const loaded = await pending;
  const king = loaded['wK'];
  assert.ok(king);
  assert.equal(fetch.mock.calls.length, 1);
  assert.equal(
    king.src,
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(VECTOR)}`
  );
  assert.equal(await fetchPieceSvgText(king.src), VECTOR);
  assert.equal(fetch.mock.calls.length, 1);
});

test('loaded pieces export offline even after their network text cache is evicted', async (context) => {
  images();
  const pieceImages = await preloadPieceStyle('offline-export-test', {
    wP: ''
  });
  for (let i = 0; i < 220; i++)
    await fetchPieceSvgText(`https://pieces.test/cache-fill-${i}.svg`);
  context.mock.method(globalThis, 'fetch', () =>
    assert.fail('loaded artwork must export without a network request')
  );
  const blob = await getSVGBlob({
    boardSize: 8,
    showCoords: false,
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
    flipped: false,
    fen: '8/8/8/8/8/8/PP6/8 w - - 0 1',
    pieceImages
  });
  const svg = await blob.text();
  assert.equal((svg.match(/<symbol /g) ?? []).length, 1);
  assert.equal((svg.match(/<use /g) ?? []).length, 2);
  assert.ok(!svg.includes('<image'));
});

test('invalid fetched artwork is not displayed or cached and can be retried', async (context) => {
  const created = images();
  const fetch = context.mock.method(
    globalThis,
    'fetch',
    async () => new Response('not an SVG')
  );
  assert.deepEqual(
    await preloadPieceStyle('invalid-source-test', { wQ: '' }),
    {}
  );
  const firstImage = created[0];
  assert.ok(firstImage);
  assert.equal(firstImage.src, '');
  assert.deepEqual(getCachedPieceStyle('invalid-source-test', { wQ: '' }), {});
  fetch.mock.mockImplementation(async () => new Response(VECTOR));
  assert.ok((await preloadPieceStyle('invalid-source-test', { wQ: '' }))['wQ']);
  assert.equal(fetch.mock.calls.length, 2);
});

test('inlined pieces are shown on the first render, before they decode', () => {
  images();
  inlinePieceSources([
    [
      '/piece/inline-first-render/wK.svg',
      `data:image/svg+xml,${encodeURIComponent(VECTOR)}`
    ]
  ]);
  const pieces = { wK: '', bK: '' };

  const shown = getDisplayablePieceStyle('inline-first-render', pieces);

  assert.deepEqual(Object.keys(shown), ['wK']);
  assert.ok(shown['wK']?.src.startsWith('data:image/svg+xml'));
  assert.deepEqual(getCachedPieceStyle('inline-first-render', pieces), {});
});
