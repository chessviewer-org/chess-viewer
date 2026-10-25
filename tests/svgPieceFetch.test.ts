import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { fetchPieceSvgText } from '@utils/pieceSvg';
import { generateBoardSVG, getSVGBlob } from '@utils/svgExporter';

const PIECE_DIR = join(process.cwd(), 'public', 'piece');
const FEN = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
const INLINE_SVG = `data:image/svg+xml,${encodeURIComponent('<svg viewBox="0 0 45 45"><path d="M0 0h45v45H0z"/></svg>')}`;

let server: Server | null = null;
let baseUrl = '';
const requests = new Map<string, number>();

before(async () => {
  const artwork = new Map(
    await Promise.all(
      ['wK.svg', 'bK.svg'].map(
        async (file) =>
          [file, await readFile(join(PIECE_DIR, 'cburnett', file))] as const
      )
    )
  );
  const listener = createServer((req, res) => {
    const path = req.url ?? '/';
    const count = (requests.get(path) ?? 0) + 1;
    requests.set(path, count);
    const [, mode, set, file] = path.split('/');
    if (mode === 'missing' || !set || !file) {
      res.writeHead(404);
      res.end();
      return;
    }
    if (
      mode === 'unavailable' ||
      (mode === 'recover' && count <= 3) ||
      (mode === 'flaky' && count < 3)
    ) {
      res.writeHead(503);
      res.end();
      return;
    }
    if (mode === 'invalid') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<html>Artwork unavailable</html>');
      return;
    }
    const data = set === 'cburnett' ? artwork.get(file) : undefined;
    if (!data) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': 'image/svg+xml' });
    res.end(data);
  });
  server = listener;
  await new Promise<void>((resolve) => {
    listener.listen(0, '127.0.0.1', () => resolve());
  });
  const address = listener.address();
  if (address && typeof address === 'object') {
    baseUrl = `http://127.0.0.1:${address.port}`;
  }
});

after(async () => {
  if (server) {
    const listener = server;
    await new Promise<void>((resolve) => listener.close(() => resolve()));
    server = null;
  }
});

function fakeImg(src: string): HTMLImageElement {
  return {
    complete: true,
    naturalWidth: 45,
    naturalHeight: 45,
    src,
    currentSrc: src
  } as unknown as HTMLImageElement;
}

function configFor(src: string) {
  return {
    boardSize: 8,
    showCoords: false,
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
    flipped: false,
    fen: FEN,
    pieceImages: { wK: fakeImg(src), bK: fakeImg(INLINE_SVG) },
    showCoordinateBorder: false,
    exportQuality: 4
  };
}

describe('SVG piece fetching', () => {
  test('retries a failing request and still embeds vector pieces', async () => {
    const svg = await generateBoardSVG({
      boardSize: 8,
      showCoords: false,
      lightSquare: '#f0d9b5',
      darkSquare: '#b58863',
      flipped: false,
      fen: FEN,
      pieceImages: {
        wK: fakeImg(`${baseUrl}/flaky/cburnett/wK.svg`),
        bK: fakeImg(`${baseUrl}/flaky/cburnett/bK.svg`)
      },
      showCoordinateBorder: false,
      exportQuality: 4
    });

    assert.equal(requests.get('/flaky/cburnett/wK.svg'), 3);
    assert.equal(requests.get('/flaky/cburnett/bK.svg'), 3);
    assert.equal((svg.match(/<symbol /g) ?? []).length, 2);
    assert.ok(!svg.includes('<image'), 'pieces must not fall back to raster');
  });

  test('does not retry when the artwork does not exist', async () => {
    const text = await fetchPieceSvgText(`${baseUrl}/missing/cburnett/wQ.svg`);

    assert.equal(text, null);
    assert.equal(requests.get('/missing/cburnett/wQ.svg'), 1);
  });

  for (const [mode, count] of [
    ['unavailable', 3],
    ['missing', 1],
    ['invalid', 1]
  ] as const) {
    test(`rejects SVG export instead of rasterizing ${mode} artwork`, async () => {
      await assert.rejects(
        getSVGBlob(configFor(`${baseUrl}/${mode}/cburnett/wK.svg`)),
        /Vector artwork is unavailable for wK/
      );
      assert.equal(requests.get(`/${mode}/cburnett/wK.svg`), count);
    });
  }

  test('an export can be retried successfully after the server recovers', async () => {
    const config = configFor(`${baseUrl}/recover/cburnett/wK.svg`);
    await assert.rejects(
      getSVGBlob(config),
      /Vector artwork is unavailable for wK/
    );
    const blob = await getSVGBlob(config);
    const svg = await blob.text();
    assert.equal(blob.type, 'image/svg+xml;charset=utf-8');
    assert.equal(requests.get('/recover/cburnett/wK.svg'), 4);
    assert.equal((svg.match(/<symbol /g) ?? []).length, 2);
    assert.ok(!svg.includes('<image'));
    assert.ok(!svg.includes('data:image/'));
  });

  test('rejects raster sources instead of embedding them in an SVG file', async () => {
    await assert.rejects(
      getSVGBlob(configFor('data:image/png;base64,cG5n')),
      /Vector artwork is unavailable for wK/
    );
  });
});
