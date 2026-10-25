import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, describe, test } from 'node:test';
import { createServer, type Server } from 'node:http';
import { join, resolve, sep } from 'node:path';

import { buildPieceVector, namespacePieceIds } from '@utils/pieceSvg';
import { boardOutlineWidth } from '@chessviewer-org/chess-viewer';
import { generateBoardSVG, SVG_BOARD_PX } from '@utils/svgExporter';

const PUBLIC_DIR = join(process.cwd(), 'public');
const PIECE_DIR = join(PUBLIC_DIR, 'piece');
const SVG_TOTAL_PX =
  SVG_BOARD_PX + SVG_BOARD_PX * 0.05 + boardOutlineWidth(SVG_BOARD_PX) * 2;

function physicalCm(boardCm: number): string {
  return `${Number((boardCm * (SVG_TOTAL_PX / SVG_BOARD_PX)).toFixed(2))}cm`;
}
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const PIECE_KEYS = [
  'wK',
  'wQ',
  'wR',
  'wB',
  'wN',
  'wP',
  'bK',
  'bQ',
  'bR',
  'bB',
  'bN',
  'bP'
];

let server: Server | null = null;
let baseUrl = '';

before(async () => {
  server = createServer((req, res) => {
    const notFound = () => {
      res.writeHead(404);
      res.end();
    };
    const file = resolve(
      PUBLIC_DIR,
      decodeURIComponent((req.url ?? '/').replace(/^\//, ''))
    );
    if (!file.startsWith(PUBLIC_DIR + sep)) {
      notFound();
      return;
    }
    readFile(file)
      .then((data) => {
        res.writeHead(200, { 'content-type': 'image/svg+xml' });
        res.end(data);
      })
      .catch(notFound);
  });
  await new Promise<void>((resolve) => {
    server!.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address();
  if (addr && typeof addr === 'object') {
    baseUrl = `http://127.0.0.1:${addr.port}`;
  }
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  }
});

function fakeImg(src: string, naturalWidth = 512): HTMLImageElement {
  return {
    complete: true,
    naturalWidth,
    naturalHeight: naturalWidth,
    src,
    currentSrc: src
  } as unknown as HTMLImageElement;
}

function pieceImagesFor(set: string): Record<string, HTMLImageElement> {
  const out: Record<string, HTMLImageElement> = {};
  for (const key of PIECE_KEYS) {
    out[key] = fakeImg(`${baseUrl}/piece/${set}/${key}.svg`);
  }
  return out;
}

function baseConfig(
  pieceImages: Record<string, HTMLImageElement>,
  fen: string = START_FEN,
  boardSize = 8
) {
  return {
    boardSize,
    showCoords: true,
    lightSquare: '#f0d9b5',
    darkSquare: '#b58863',
    flipped: false,
    fen,
    pieceImages,
    showCoordinateBorder: true,
    exportQuality: 4
  };
}

function collectIds(svg: string): string[] {
  return [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!);
}

function collectHrefRefs(svg: string): string[] {
  return [...svg.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]!);
}

function collectUrlRefs(svg: string): string[] {
  return [...svg.matchAll(/url\(#([^)\s]+)\)/g)].map((m) => m[1]!);
}

function countMatches(svg: string, re: RegExp): number {
  return (svg.match(re) ?? []).length;
}

function pieceCountInFen(fen: string): number {
  const boardPart = fen.split(' ')[0] ?? '';
  return (boardPart.match(/[a-zA-Z]/g) ?? []).length;
}

describe('buildPieceVector (real piece files)', () => {
  test('extracts viewBox and non-empty content for cburnett wK', async () => {
    const text = await readFile(join(PIECE_DIR, 'cburnett', 'wK.svg'), 'utf8');
    const vector = buildPieceVector(text);
    assert.ok(vector, 'vector must not be null');
    assert.equal(vector!.viewBox, '0 0 45 45');
    assert.ok(vector!.content.length > 100);
    assert.ok(vector!.content.includes('<path'));
  });

  test('extracts viewBox for mm-based sets (merida)', async () => {
    const text = await readFile(join(PIECE_DIR, 'merida', 'wK.svg'), 'utf8');
    const vector = buildPieceVector(text);
    assert.ok(vector);
    assert.equal(vector!.viewBox, '0 0 50 50');
  });

  test('extracts viewBox for pt-based sets (horsey)', async () => {
    const text = await readFile(join(PIECE_DIR, 'horsey', 'wK.svg'), 'utf8');
    const vector = buildPieceVector(text);
    assert.ok(vector);
    assert.equal(vector!.viewBox, '0 0 400 400');
  });

  test('extracts negative-origin viewBox (california)', async () => {
    const text = await readFile(
      join(PIECE_DIR, 'california', 'wK.svg'),
      'utf8'
    );
    const vector = buildPieceVector(text);
    assert.ok(vector);
    assert.equal(vector!.viewBox, '-50 -60 478.77 511.58');
  });

  test('synthesizes viewBox for viewBox-less sets (icpieces)', async () => {
    const text = await readFile(join(PIECE_DIR, 'icpieces', 'wK.svg'), 'utf8');
    assert.ok(!/viewBox/i.test(text.split('>')[0] ?? ''));
    const vector = buildPieceVector(text);
    assert.ok(vector, 'icpieces must get a synthesized viewBox');
    assert.equal(vector!.viewBox, '0 0 368 368');
  });

  test('strips XML declaration and DOCTYPE', () => {
    const text =
      '<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' +
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect/></svg>';
    const vector = buildPieceVector(text);
    assert.ok(vector);
    assert.equal(vector!.content, '<rect/>');
    assert.ok(!vector!.content.includes('<?xml'));
  });

  test('returns null for non-SVG text', () => {
    assert.equal(buildPieceVector('hello world'), null);
    assert.equal(buildPieceVector(''), null);
  });

  test('returns null for empty SVG body', () => {
    assert.equal(buildPieceVector('<svg viewBox="0 0 10 10"></svg>'), null);
  });

  test('returns null when neither viewBox nor dimensions exist', () => {
    assert.equal(buildPieceVector('<svg><rect/></svg>'), null);
  });
});

describe('namespacePieceIds', () => {
  test('prefixes id definitions, url() refs and href refs', () => {
    const vector = {
      viewBox: '0 0 10 10',
      content:
        '<defs><linearGradient id="a"><stop/></linearGradient>' +
        '<filter id="b"><feGaussianBlur/></filter></defs>' +
        '<path fill="url(#a)" filter="url(#b)"/>' +
        '<use href="#a"/>'
    };
    const out = namespacePieceIds(vector, 'P-');
    assert.ok(out.includes('id="P-a"'));
    assert.ok(out.includes('id="P-b"'));
    assert.ok(out.includes('url(#P-a)'));
    assert.ok(out.includes('url(#P-b)'));
    assert.ok(out.includes('href="#P-a"'));
    assert.ok(!out.includes('id="a"'));
    assert.ok(!out.includes('url(#a)'));
  });

  test('does not corrupt attributes that merely end with "id"', () => {
    const vector = {
      viewBox: '0 0 10 10',
      content: '<path grid="1" solid-color="#fff" id="x" xlink:href="#x"/>'
    };
    const out = namespacePieceIds(vector, 'P-');
    assert.ok(out.includes('grid="1"'));
    assert.ok(out.includes('solid-color="#fff"'));
    assert.ok(out.includes('id="P-x"'));
    assert.ok(out.includes('href="#P-x"'));
  });

  test('handles ids with digits, dashes and underscores', () => {
    const vector = {
      viewBox: '0 0 10 10',
      content: '<g id="grad-1_a"/><path fill="url(#grad-1_a)"/>'
    };
    const out = namespacePieceIds(vector, 'cv-p-wK-');
    assert.ok(out.includes('id="cv-p-wK-grad-1_a"'));
    assert.ok(out.includes('url(#cv-p-wK-grad-1_a)'));
  });
});

describe('generateBoardSVG end-to-end: cburnett', () => {
  let svg = '';

  before(async () => {
    svg = await generateBoardSVG(baseConfig(pieceImagesFor('cburnett')));
  });

  test('output is a complete SVG document', () => {
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.endsWith('</svg>'));
  });

  test('pieces are TRUE inline vectors — zero <image> raster embeds', () => {
    assert.equal(countMatches(svg, /<image\b/g), 0);
    assert.ok(!svg.includes('data:image/'), 'no data-URL images allowed');
    assert.ok(!svg.includes('base64'), 'no base64 payloads allowed');
  });

  test('12 piece symbols defined, 32 pieces placed via <use>', () => {
    assert.equal(countMatches(svg, /<symbol /g), 12);
    assert.equal(countMatches(svg, /<use /g), pieceCountInFen(START_FEN));
    assert.equal(countMatches(svg, /<use /g), 32);
  });

  test('all symbol ids follow cv-p-{key} scheme', () => {
    for (const key of PIECE_KEYS) {
      assert.ok(
        svg.includes(`<symbol id="cv-p-${key}"`),
        `missing symbol for ${key}`
      );
    }
  });

  test('every href reference resolves to a defined symbol', () => {
    const ids = new Set(collectIds(svg));
    for (const ref of collectHrefRefs(svg)) {
      assert.ok(ids.has(ref), `dangling href reference: #${ref}`);
    }
  });

  test('every url(#...) reference resolves to a defined id', () => {
    const ids = new Set(collectIds(svg));
    for (const ref of collectUrlRefs(svg)) {
      assert.ok(ids.has(ref), `dangling url() reference: #${ref}`);
    }
  });

  test('all ids in the document are unique', () => {
    const ids = collectIds(svg);
    assert.equal(new Set(ids).size, ids.length, 'duplicate id detected');
  });

  test('source viewBox preserved verbatim in every symbol', async () => {
    for (const key of PIECE_KEYS) {
      const text = await readFile(
        join(PIECE_DIR, 'cburnett', `${key}.svg`),
        'utf8'
      );
      const vector = buildPieceVector(text);
      assert.ok(vector);
      assert.ok(
        svg.includes(`<symbol id="cv-p-${key}" viewBox="${vector!.viewBox}"`),
        `viewBox lost for ${key}`
      );
    }
  });

  test('vector path data is preserved losslessly (every source d= attr present)', async () => {
    for (const key of PIECE_KEYS) {
      const text = await readFile(
        join(PIECE_DIR, 'cburnett', `${key}.svg`),
        'utf8'
      );
      const paths = [...text.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
      assert.ok(paths.length > 0, `${key} has no paths?`);
      for (const d of paths) {
        assert.ok(svg.includes(`d="${d}"`), `path data lost for ${key}`);
      }
    }
  });

  test('physical print size keeps the 8cm board and adds coords + outline', () => {
    assert.ok(svg.includes(`width="${physicalCm(8)}"`));
    assert.ok(svg.includes(`height="${physicalCm(8)}"`));
    assert.ok(svg.includes(`viewBox="0 0 ${SVG_TOTAL_PX} ${SVG_TOTAL_PX}"`));
  });

  test('64 squares are drawn', () => {
    // 64 squares + border rect (1) => at least 65 rects
    assert.ok(countMatches(svg, /<rect /g) >= 65);
  });

  test('coordinate labels are present (a-h, 1-8)', () => {
    for (const ch of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '1', '8']) {
      assert.ok(
        svg.includes(`>${ch}</text>`),
        `missing coordinate label ${ch}`
      );
    }
  });
});

describe('generateBoardSVG end-to-end: cardinal (ID-heavy set)', () => {
  let svg = '';

  before(async () => {
    svg = await generateBoardSVG(baseConfig(pieceImagesFor('cardinal')));
  });

  test('zero <image> embeds even with gradient/filter pieces', () => {
    assert.equal(countMatches(svg, /<image\b/g), 0);
  });

  test('ids remain unique despite 8 pawns sharing gradient defs', () => {
    const ids = collectIds(svg);
    assert.ok(ids.length >= 12, 'expected namespaced piece ids');
    assert.equal(new Set(ids).size, ids.length, 'duplicate id across symbols');
  });

  test('all url(#...) gradient/filter references resolve', () => {
    const ids = new Set(collectIds(svg));
    const refs = collectUrlRefs(svg);
    assert.ok(refs.length > 0, 'cardinal must produce url(#...) references');
    for (const ref of refs) {
      assert.ok(ids.has(ref), `dangling url() reference: #${ref}`);
    }
  });

  test('gradient definitions are inlined', () => {
    assert.ok(svg.includes('<linearGradient'));
    assert.ok(svg.includes('<filter'));
  });
});

describe('generateBoardSVG end-to-end: icpieces (viewBox-less)', () => {
  let svg = '';

  before(async () => {
    svg = await generateBoardSVG(baseConfig(pieceImagesFor('icpieces')));
  });

  test('viewBox-less pieces are still inlined as vectors (synthesized viewBox)', () => {
    assert.equal(countMatches(svg, /<image\b/g), 0);
    assert.equal(countMatches(svg, /<symbol /g), 12);
    assert.ok(svg.includes('viewBox="0 0 368 368"'));
  });

  test('all references resolve and ids stay unique', () => {
    const ids = new Set(collectIds(svg));
    for (const ref of collectHrefRefs(svg)) {
      assert.ok(ids.has(ref), `dangling reference #${ref}`);
    }
    const allIds = collectIds(svg);
    assert.equal(new Set(allIds).size, allIds.length);
  });
});

describe('generateBoardSVG physical size across board sizes', () => {
  test('raster quality presets do not alter vector artwork or physical SVG size', async () => {
    const config = baseConfig(pieceImagesFor('cburnett'));
    const original = await generateBoardSVG({ ...config, exportQuality: 1 });
    for (const exportQuality of [2, 3, 4]) {
      assert.equal(
        await generateBoardSVG({ ...config, exportQuality }),
        original
      );
    }
  });
  test('4cm and 6cm boards scale with coords + outline', async () => {
    for (const [cm, expected] of [
      [4, physicalCm(4)],
      [6, physicalCm(6)]
    ] as const) {
      const out = await generateBoardSVG(
        baseConfig(pieceImagesFor('cburnett'), START_FEN, cm)
      );
      assert.ok(out.includes(`width="${expected}"`), `${cm}cm width`);
      assert.ok(out.includes(`height="${expected}"`), `${cm}cm height`);
    }
  });

  test('few-piece position: symbol/use counts match FEN', async () => {
    const fen = '8/8/8/8/8/5K2/8/4k2R w - - 0 1';
    const out = await generateBoardSVG(
      baseConfig(pieceImagesFor('cburnett'), fen)
    );
    assert.equal(countMatches(out, /<use /g), pieceCountInFen(fen));
    assert.equal(countMatches(out, /<symbol /g), 3);
  });

  test('flipped board produces same piece count', async () => {
    const out = await generateBoardSVG({
      ...baseConfig(pieceImagesFor('cburnett')),
      flipped: true
    });
    assert.equal(countMatches(out, /<use /g), 32);
  });
});

describe('fairy SVG export', () => {
  test('reports missing artwork instead of producing a diagram with missing pieces', async () => {
    await assert.rejects(
      generateBoardSVG(
        baseConfig(
          { wK: fakeImg(`${baseUrl}/piece/cburnett/wK.svg`) },
          '-Q7/8/8/8/8/8/8/7K w - - 0 1'
        )
      ),
      /neutral queen artwork could not be loaded/
    );
  });
  test('preserves neutral and rotated artwork instead of replacing it with base pieces', async () => {
    const images = {
      nQ180: fakeImg(`${baseUrl}/fairypiece/cburnett/nQ180.svg`),
      bN270: fakeImg(`${baseUrl}/fairypiece/cburnett/bN270.svg`),
      wK: fakeImg(`${baseUrl}/piece/cburnett/wK.svg`)
    };
    const out = await generateBoardSVG(
      baseConfig(images, '-*2Q7/1*3n6/8/8/8/8/8/7K w - - 0 1')
    );
    assert.equal(countMatches(out, /<use /g), 3);
    assert.equal(countMatches(out, /<symbol /g), 3);
    assert.match(out, /rotate\(180 50 50\)/);
    assert.match(out, /rotate\(270 50 50\)/);
    const ids = collectIds(out);
    assert.equal(new Set(ids).size, ids.length);
    for (const ref of collectUrlRefs(out))
      assert.ok(ids.includes(ref), `unresolved ${ref}`);
  });
});
