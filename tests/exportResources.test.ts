import assert from 'node:assert/strict';
import { fetchPieceSvgText } from '../src/shared/utils/pieceSvg';
import { afterEach, test } from 'node:test';

import { createUltraQualityCanvas } from '../src/shared/utils/canvasRenderer';
import { createRasterBlob } from '../src/shared/utils/exportRaster';
import {
  ensurePieceResolution,
  waitForPieceImage
} from '../src/shared/utils/pieceUtils';
import { generateBoardSVG } from '../src/shared/utils/svgExporter';
import { resetExportState } from '../src/shared/utils/exportState';

const originals = new Map<
  object,
  Map<PropertyKey, PropertyDescriptor | undefined>
>();

function replace(target: object, key: PropertyKey, value: unknown) {
  let properties = originals.get(target);
  if (!properties) originals.set(target, (properties = new Map()));
  if (!properties.has(key))
    properties.set(key, Object.getOwnPropertyDescriptor(target, key));
  Object.defineProperty(target, key, { configurable: true, value });
}

afterEach(() => {
  for (const [target, properties] of originals) {
    for (const [key, descriptor] of properties) {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else Reflect.deleteProperty(target, key);
    }
  }
  originals.clear();
  resetExportState();
});

const VECTOR =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="45" height="45"><path d="M0 0h45v45H0z"/></svg>';

class TestImage extends EventTarget {
  complete = false;
  naturalWidth = 0;
  naturalHeight = 0;
  src = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  listeners = new Set<EventListenerOrEventListenerObject>();

  override addEventListener(
    name: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ) {
    if (listener) this.listeners.add(listener);
    super.addEventListener(name, listener, options);
  }

  override removeEventListener(
    name: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ) {
    if (listener) this.listeners.delete(listener);
    super.removeEventListener(name, listener, options);
  }

  get element() {
    return this as unknown as HTMLImageElement;
  }
}

function readyImage(src: string, size = 1024) {
  const image = new TestImage();
  image.src = src;
  image.complete = true;
  image.naturalWidth = image.naturalHeight = size;
  return image;
}

function resolutionRuntime(fail = false) {
  const created: TestImage[] = [];
  const revoked: string[] = [];
  const blobs = new Map<string, Blob>();
  let objectUrlId = 0;
  replace(URL, 'createObjectURL', (blob: Blob) => {
    const url = `blob:resource-test-${++objectUrlId}`;
    blobs.set(url, blob);
    return url;
  });
  replace(URL, 'revokeObjectURL', (url: string) => {
    revoked.push(url);
    blobs.delete(url);
  });
  replace(
    globalThis,
    'Image',
    class extends TestImage {
      constructor() {
        super();
        created.push(this);
        // Wait until the caller has assigned src and installed its listeners.
        queueMicrotask(async () => {
          if (fail) {
            this.onerror?.();
            return;
          }
          const text = await blobs.get(this.src)!.text();
          this.naturalWidth = Number(/width="(\d+)"/.exec(text)?.[1]);
          this.naturalHeight = Number(/height="(\d+)"/.exec(text)?.[1]);
          this.complete = true;
          this.onload?.();
        });
      }
    }
  );
  return { created, revoked, blobs };
}

test('concurrent high resolution exports fetch and decode each source once, then revoke its URL', async () => {
  const runtime = resolutionRuntime();
  let requests = 0;
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => (finish = resolve));
  replace(globalThis, 'fetch', async () => {
    requests++;
    await pending;
    return new Response(VECTOR);
  });
  const image = readyImage('https://pieces.test/shared-resolution.svg', 45);
  const first = ensurePieceResolution(image.element, 512);
  const second = ensurePieceResolution(image.element, 512);
  const source = fetchPieceSvgText(image.src);
  assert.equal(requests, 1);
  finish();
  const [a, b] = await Promise.all([first, second]);
  assert.equal(a, b);
  assert.equal(await source, VECTOR);
  assert.equal(runtime.created.length, 1);
  assert.equal(a.naturalWidth, 512);
  assert.equal(runtime.revoked.length, 1);
  assert.equal(runtime.blobs.size, 0);
  assert.equal(runtime.created[0]!.onload, null);
  assert.equal(runtime.created[0]!.onerror, null);
  assert.equal(await ensurePieceResolution(image.element, 512), a);
  assert.equal(requests, 1);
  assert.equal(runtime.created.length, 1);
});

test('failed high resolution decoding revokes its URL and permits retry', async (context) => {
  context.mock.method(console, 'warn', () => {});
  const runtime = resolutionRuntime(true);
  let requests = 0;
  replace(globalThis, 'fetch', async () => {
    requests++;
    return new Response(VECTOR);
  });
  const image = readyImage('https://pieces.test/retry-resolution.svg', 45);
  assert.equal(await ensurePieceResolution(image.element, 256), image.element);
  assert.equal(await ensurePieceResolution(image.element, 256), image.element);
  assert.equal(runtime.created.length, 2);
  assert.equal(runtime.revoked.length, 2);
  assert.equal(runtime.blobs.size, 0);
  assert.equal(requests, 1, 'the successful SVG response is reused for retry');
});

test('a stalled high resolution decode times out and releases its URL and handlers', async (context) => {
  context.mock.method(console, 'warn', () => {});
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const created: TestImage[] = [];
  const revoked: string[] = [];
  replace(
    globalThis,
    'Image',
    class extends TestImage {
      constructor() {
        super();
        created.push(this);
      }
    }
  );
  replace(URL, 'createObjectURL', () => 'blob:stalled-resolution');
  replace(URL, 'revokeObjectURL', (url: string) => revoked.push(url));
  const image = readyImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(VECTOR)}`,
    45
  );
  const pending = ensurePieceResolution(image.element, 513);
  await Promise.resolve();
  assert.equal(created.length, 1);
  context.mock.timers.tick(10000);
  assert.equal(await pending, image.element);
  assert.deepEqual(revoked, ['blob:stalled-resolution']);
  assert.equal(created[0]!.onload, null);
  assert.equal(created[0]!.onerror, null);
});

test('high resolution decoded-image cache is bounded by pixels, not only image count', async () => {
  const runtime = resolutionRuntime();
  let requests = 0;
  replace(globalThis, 'fetch', async () => {
    requests++;
    return new Response(VECTOR);
  });
  const pieces = Array.from({ length: 5 }, (_, index) =>
    readyImage(`https://pieces.test/pixel-budget-${index}.svg`, 45)
  );
  for (const image of pieces) await ensurePieceResolution(image.element, 2048);
  assert.equal(runtime.created.length, 5);
  await ensurePieceResolution(pieces[0]!.element, 2048);
  assert.equal(runtime.created.length, 6, 'oldest 2048px image was evicted');
  assert.equal(
    requests,
    5,
    'small SVG text remains cached after pixel eviction'
  );
  assert.equal(runtime.revoked.length, 6);
});

test('inline SVG letter artwork can be upgraded without a network request', async () => {
  const runtime = resolutionRuntime();
  replace(globalThis, 'fetch', () => assert.fail('inline SVG must not fetch'));
  const image = readyImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(VECTOR)}`,
    45
  );
  const upgraded = await ensurePieceResolution(image.element, 512);
  assert.equal(upgraded.naturalWidth, 512);
  assert.equal(runtime.created.length, 1);
  assert.equal(runtime.revoked.length, 1);
});

test('dimension-only SVG artwork is rendered at the requested print resolution', async () => {
  const runtime = resolutionRuntime();
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="368" height="368"><path d="M0 0h368v368H0z"/></svg>';
  const image = readyImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    368
  );
  const upgraded = await ensurePieceResolution(image.element, 473);
  assert.equal(upgraded.naturalWidth, 473);
  assert.equal(upgraded.naturalHeight, 473);
  assert.equal(runtime.created.length, 1);
  assert.equal(runtime.revoked.length, 1);
  assert.equal(runtime.blobs.size, 0);
});

test('image waiting preserves owner handlers and cleans listeners after timeout or load', async () => {
  const image = new TestImage();
  const onload = () => {};
  image.onload = onload;
  const timedOut = waitForPieceImage(image.element, 1);
  assert.equal(image.listeners.size, 1);
  await timedOut;
  assert.equal(image.listeners.size, 0);
  assert.equal(image.onload, onload);
  const loaded = waitForPieceImage(image.element, 10000);
  image.dispatchEvent(new Event('load'));
  await loaded;
  assert.equal(image.listeners.size, 0);
  assert.equal(image.onload, onload);
});

interface Fill {
  color: string;
  operation: string;
  width: number;
  height: number;
}

function canvasRuntime() {
  const canvases: Array<ReturnType<typeof makeCanvas>> = [];
  function makeCanvas() {
    const fills: Fill[] = [];
    const drawings: unknown[] = [];
    const context = {
      fillStyle: '',
      globalCompositeOperation: 'source-over',
      save() {},
      restore() {},
      clearRect() {},
      fillRect(_x: number, _y: number, width: number, height: number) {
        fills.push({
          color: context.fillStyle,
          operation: context.globalCompositeOperation,
          width,
          height
        });
      },
      drawImage(image: unknown) {
        drawings.push(image);
      }
    };
    const canvas = {
      width: 0,
      height: 0,
      fills,
      drawings,
      context,
      encodedType: '',
      contextOptions: null as CanvasRenderingContext2DSettings | null,
      getContext(_type: string, options?: CanvasRenderingContext2DSettings) {
        canvas.contextOptions = options ?? null;
        return context;
      },
      toDataURL: () => 'data:image/png;base64,piece',
      toBlob(callback: (blob: Blob) => void, type: string) {
        canvas.encodedType = type;
        callback(new Blob(['image'], { type }));
      }
    };
    return canvas;
  }
  replace(globalThis, 'document', {
    createElement: (name: string) => {
      assert.equal(name, 'canvas');
      const canvas = makeCanvas();
      canvases.push(canvas);
      return canvas;
    }
  });
  return canvases;
}

function renderConfig(pieceImages: Record<string, HTMLImageElement>) {
  return {
    boardSize: 2,
    showCoords: false,
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
    flipped: false,
    fen: '8/8/8/8/8/8/PP6/8 w - - 0 1',
    pieceImages,
    exportQuality: 1,
    squarePattern: 'solid' as const
  };
}

test('canvas and SVG export ignore unused loading palette images and render only placed pieces', async () => {
  const canvases = canvasRuntime();
  const used = readyImage(`data:image/svg+xml,${encodeURIComponent(VECTOR)}`);
  const unused = new TestImage();
  let unusedTouched = false;
  Object.defineProperty(unused, 'complete', {
    get() {
      unusedTouched = true;
      throw new Error('unused palette artwork must not be inspected');
    }
  });
  const palette = Object.fromEntries(
    Array.from({ length: 206 }, (_, index) => [
      `unused-${index}`,
      unused.element
    ])
  );
  const config = renderConfig({ ...palette, wP: used.element });
  const canvas = await createUltraQualityCanvas(config);
  assert.equal(canvases.length, 1);
  assert.equal(canvases[0]!.drawings.length, 2);
  assert.ok(canvases[0]!.drawings.every((image) => image === used.element));
  assert.ok(canvas.width > 0);
  const svg = await generateBoardSVG(config);
  assert.equal((svg.match(/<symbol /g) ?? []).length, 1);
  assert.equal((svg.match(/<use /g) ?? []).length, 2);
  assert.equal(unusedTouched, false);
});

test('JPEG renders once on an opaque white canvas; PNG keeps transparency', async () => {
  const canvases = canvasRuntime();
  const config = renderConfig({
    wP: readyImage('data:image/png,pawn').element
  });
  const jpeg = await createRasterBlob(config, 'jpeg');
  assert.equal(jpeg.type, 'image/jpeg');
  assert.equal(canvases.length, 1, 'no second full-size JPEG canvas');
  const [jpegCanvas] = canvases;
  assert.equal(jpegCanvas!.contextOptions?.alpha, false);
  const background = jpegCanvas!.fills[0]!;
  assert.equal(background.color, '#fff');
  assert.ok(background.width > 0 && background.height > 0);
  assert.ok(
    jpegCanvas!.fills.every((fill) => fill.operation === 'source-over'),
    'JPEG needs no full-size compositing pass'
  );
  assert.equal(jpegCanvas!.width, 0, 'backing pixels released after encoding');
  assert.equal(jpegCanvas!.height, 0);
  const png = await createRasterBlob(config, 'png');
  assert.equal(png.type, 'image/png');
  assert.equal(canvases.length, 2);
  assert.equal(canvases[1]!.contextOptions?.alpha, true);
  assert.ok(
    canvases[1]!.fills.every((fill) => fill.color !== '#fff'),
    'PNG must not paint transparent margins white'
  );
});
