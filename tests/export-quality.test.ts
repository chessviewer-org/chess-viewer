import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, test } from 'node:test';

import {
  calculateRenderSurfaceSize,
  normalizeExportQuality,
  estimateFileSizes,
  formatFileSize
} from '@utils/imageOptimizer';
import { intrinsicPxOf, resizePieceSvg } from '@utils/pieceUtils';
import { boardOutlineWidth } from '@chessviewer-org/chess-viewer';

const CM_PER_INCH = 2.54;
const PRINT_DPI = 300;

function calcBoardPixels(cm: number, quality: number): number {
  return Math.round((cm / CM_PER_INCH) * PRINT_DPI * quality);
}

const BOARD_SIZES = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];
const QUALITIES = [1, 2, 3, 4];

test('all supported sizes and quality presets keep exact print resolution', () => {
  for (const cm of BOARD_SIZES) {
    for (const quality of QUALITIES) {
      const surface = calculateRenderSurfaceSize(cm, true, quality);
      const context = `${cm}cm at ${quality}×`;
      assert.equal(surface.boardPixels, calcBoardPixels(cm, quality), context);
      assert.equal(surface.effectiveDPI, PRINT_DPI * quality, context);
      assert.equal(surface.canvasWidth, surface.canvasHeight, context);
      assert.equal(
        surface.scaleFactor,
        1,
        `${context}: browser canvas limit reduced quality`
      );
    }
  }
});

describe('coordinate border', () => {
  test('coords ON → border > 0 and canvas > boardPixels', () => {
    for (const cm of BOARD_SIZES) {
      for (const q of QUALITIES) {
        const s = calculateRenderSurfaceSize(cm, true, q);
        assert.ok(s.borderSize > 0, `${cm}cm ${q}×: no border`);
        assert.ok(
          s.canvasWidth > s.boardPixels,
          `${cm}cm ${q}×: canvas ${s.canvasWidth} <= board ${s.boardPixels}`
        );
      }
    }
  });

  test('coords OFF → border = 0 and canvas = board + outline on both sides', () => {
    for (const cm of BOARD_SIZES) {
      for (const q of QUALITIES) {
        const s = calculateRenderSurfaceSize(cm, false, q);
        const framed = s.boardPixels + s.outline * 2;
        assert.equal(s.borderSize, 0, `${cm}cm ${q}×: border not zero`);
        assert.equal(s.outline, boardOutlineWidth(s.boardPixels));
        assert.equal(
          s.canvasWidth,
          framed,
          `${cm}cm ${q}×: canvas ${s.canvasWidth} !== framed board ${framed}`
        );
        assert.equal(
          s.canvasHeight,
          framed,
          `${cm}cm ${q}×: canvas ${s.canvasHeight} !== framed board ${framed}`
        );
      }
    }
  });
});

describe('intrinsicPxOf — bütün vahidlərdə düzgün', () => {
  const CASES: Array<[string, string, number]> = [
    ['px', '<svg width="512" height="512"/>', 512],
    ['mm', '<svg width="50mm" height="50mm" viewBox="0 0 50 50"/>', 189],
    ['cm', '<svg width="5cm" height="5cm" viewBox="0 0 100 100"/>', 189],
    ['pt', '<svg width="700pt" height="700pt" viewBox="0 0 933 933"/>', 933],
    ['viewBox only (no dims)', '<svg viewBox="0 0 45 45"/>', 0],
    ['max of w/h', '<svg width="200" height="300"/>', 300]
  ];

  for (const [label, svg, expected] of CASES) {
    test(`${label} → ${expected}`, () => {
      assert.equal(intrinsicPxOf(svg), expected);
    });
  }

  test('child element width/height ignored', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="45" height="45">' +
      '<rect width="9999" height="9999" fill="none"/></svg>';
    assert.equal(intrinsicPxOf(svg), 45);
  });

  test('no svg tag → 0', () => {
    assert.equal(intrinsicPxOf('not an svg string'), 0);
  });
});

describe('resizePieceSvg with shipped piece artwork', () => {
  for (const [set, intrinsic, viewBox] of [
    ['cburnett', 512, '0 0 45 45'],
    ['merida', 189, '0 0 50 50'],
    ['horsey', 512, '0 0 400 400'],
    ['icpieces', 368, '0 0 368 368'],
    ['california', 100, '-50 -60 478.77 511.58']
  ] as const) {
    test(`${set} keeps its artwork and viewBox at print resolution`, async () => {
      const source = await readFile(
        join(process.cwd(), 'public', 'piece', set, 'wK.svg'),
        'utf8'
      );
      assert.equal(intrinsicPxOf(source), intrinsic);
      const resized = resizePieceSvg(source, 473);
      assert.match(resized, /<svg\b[^>]*\bwidth="473"/);
      assert.match(resized, /<svg\b[^>]*\bheight="473"/);
      assert.ok(resized.includes(`viewBox="${viewBox}"`));
      assert.equal((resized.match(/\bwidth="473"/g) ?? []).length, 1);
      assert.equal((resized.match(/\bheight="473"/g) ?? []).length, 1);
      assert.equal(
        resized.slice(resized.indexOf('>') + 1),
        source.slice(source.indexOf('>') + 1),
        'piece artwork changed while resizing the root SVG'
      );
    });
  }
});

describe('Boundary conditions', () => {
  test('unsupported quality values cannot request excessive raster allocations', () => {
    for (const quality of [0, -1, 16, 100, NaN, Infinity]) {
      assert.equal(normalizeExportQuality(quality), 2);
      const surface = calculateRenderSurfaceSize(8, true, quality);
      assert.equal(surface.effectiveDPI, 600);
      assert.equal(surface.boardPixels, Math.round((8 / 2.54) * 600));
    }
    for (const quality of QUALITIES)
      assert.equal(normalizeExportQuality(quality), quality);
  });

  test('the minimum 1cm board remains renderable', () => {
    const surface = calculateRenderSurfaceSize(1, false, 1);
    assert.ok(surface.boardPixels > 0);
    assert.ok(surface.canvasWidth >= surface.boardPixels);
  });

  test('fractional physical sizes retain the requested DPI and pixel count', () => {
    const surface = calculateRenderSurfaceSize(5.25, true, 3);
    assert.equal(surface.boardPixels, calcBoardPixels(5.25, 3));
    assert.equal(surface.effectiveDPI, 900);
    assert.equal(surface.scaleFactor, 1);
  });
});

describe('Physical dimensions', () => {
  test('physicalBoardSizeCm matches input', () => {
    for (const cm of BOARD_SIZES) {
      const s = calculateRenderSurfaceSize(cm, true, 1);
      assert.equal(s.physicalBoardSizeCm, cm);
    }
  });

  test('physicalWidth ≈ boardSize × canvasWidth / boardPixels', () => {
    for (const cm of BOARD_SIZES) {
      const s = calculateRenderSurfaceSize(cm, true, 2);
      const expectedCm = (s.canvasWidth / s.effectiveDPI) * CM_PER_INCH;
      const diff = Math.abs(s.physicalWidthCm - expectedCm);
      assert.ok(diff < 0.01, `${cm}cm: physicalWidthCm mismatch by ${diff}`);
    }
  });
});

describe('formatFileSize', () => {
  test('B → KB → MB', () => {
    assert.equal(formatFileSize(512), '512 B');
    assert.equal(formatFileSize(2048), '2 KB');
    assert.equal(formatFileSize(5 * 1024 * 1024), '5.0 MB');
  });
});

describe('estimateFileSizes', () => {
  test('grows with resolution', () => {
    const small = estimateFileSizes(1000, 1000);
    const large = estimateFileSizes(4000, 4000);
    assert.ok(small.pngBytes > 0);
    assert.ok(small.jpegBytes > 0);
    assert.ok(large.pngBytes > small.pngBytes);
    assert.ok(large.jpegBytes > small.jpegBytes);
  });

  test('bytes-per-pixel falls as image grows', () => {
    const small = estimateFileSizes(1000, 1000);
    const large = estimateFileSizes(4000, 4000);
    const smallBpp = small.pngBytes / (1000 * 1000);
    const largeBpp = large.pngBytes / (4000 * 4000);
    assert.ok(largeBpp < smallBpp);
  });
});

describe('resizePieceSvg edge cases', () => {
  test('preserves other attributes (fill-rule, xmlns)', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" viewBox="0 0 50 50" width="512" height="512">';
    const resized = resizePieceSvg(svg, 473);
    assert.ok(resized.includes('xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(resized.includes('fill-rule="evenodd"'));
    assert.ok(resized.includes('width="473"'));
    assert.ok(resized.includes('height="473"'));
    assert.ok(resized.includes('viewBox="0 0 50 50"'));
  });

  test('no duplicate width/height attributes', () => {
    const svg = '<svg viewBox="0 0 45 45" width="45" height="45">';
    const resized = resizePieceSvg(svg, 473);
    const widthCount = (resized.match(/width="/g) || []).length;
    const heightCount = (resized.match(/height="/g) || []).length;
    assert.equal(widthCount, 1);
    assert.equal(heightCount, 1);
  });

  test('resizes even when target < intrinsic (caller gates this)', () => {
    const svg = '<svg viewBox="0 0 512 512" width="512" height="512">';
    const resized = resizePieceSvg(svg, 200);
    assert.ok(resized.includes('width="200"'));
    assert.ok(resized.includes('height="200"'));
  });
});
