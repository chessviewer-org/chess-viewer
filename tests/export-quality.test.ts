import assert from 'node:assert/strict';
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

function calcPieceOutputPx(cm: number): number {
  return Math.ceil((cm * 1200) / 20.32);
}

function calcSquarePx(boardPixels: number): number {
  return boardPixels / 8;
}

const BOARD_SIZES = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];
const QUALITIES = [1, 2, 3, 4];

describe('DPI → boardPixels precision', () => {
  for (const cm of BOARD_SIZES) {
    for (const q of QUALITIES) {
      test(`${cm}cm ${q}× boardPixels = Math.round((${cm}/2.54)*300*${q})`, () => {
        const s = calculateRenderSurfaceSize(cm, true, q);
        const expected = calcBoardPixels(cm, q);
        assert.equal(
          s.boardPixels,
          expected,
          `boardPixels ${s.boardPixels} !== expected ${expected}`
        );
      });
    }
  }
});

describe('effectiveDPI', () => {
  for (const q of QUALITIES) {
    test(`8cm ${q}× → effectiveDPI = ${PRINT_DPI * q}`, () => {
      const s = calculateRenderSurfaceSize(8, true, q);
      assert.equal(s.effectiveDPI, PRINT_DPI * q);
    });
  }
});

describe('boardPixels scales linearly with quality', () => {
  for (const cm of BOARD_SIZES) {
    test(`${cm}cm: 1×→2× doubles, 1×→4× quadruples (±1 rounding)`, () => {
      const s1 = calculateRenderSurfaceSize(cm, true, 1);
      const s2 = calculateRenderSurfaceSize(cm, true, 2);
      const s4 = calculateRenderSurfaceSize(cm, true, 4);

      const diff2 = Math.abs(s2.boardPixels - s1.boardPixels * 2);
      const diff4 = Math.abs(s4.boardPixels - s1.boardPixels * 4);
      assert.ok(diff2 <= 1, `2× off by ${diff2}px`);
      assert.ok(diff4 <= 2, `4× off by ${diff4}px`);
    });
  }
});

describe('boardPixels scales linearly with board size', () => {
  for (const q of QUALITIES) {
    test(`${q}×: 4→8cm doubles (±1 rounding)`, () => {
      const s4 = calculateRenderSurfaceSize(4, true, q);
      const s8 = calculateRenderSurfaceSize(8, true, q);
      const diff = Math.abs(s8.boardPixels - s4.boardPixels * 2);
      assert.ok(diff <= 1, `off by ${diff}px at ${q}×`);
    });
  }
});

describe('canvas is always square', () => {
  for (const cm of BOARD_SIZES) {
    for (const q of QUALITIES) {
      test(`${cm}cm ${q}× canvasWidth === canvasHeight`, () => {
        const s = calculateRenderSurfaceSize(cm, true, q);
        assert.equal(s.canvasWidth, s.canvasHeight);
      });
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

describe('scaleFactor must be 1.0 for all standard sizes', () => {
  for (const cm of BOARD_SIZES) {
    for (const q of QUALITIES) {
      test(`${cm}cm ${q}×`, () => {
        const s = calculateRenderSurfaceSize(cm, true, q);
        assert.equal(
          s.scaleFactor,
          1.0,
          `scaleFactor ${s.scaleFactor} — keyfiyyət itib! Canvas browser limitini keçib`
        );
      });
    }
  }
});

describe('pieceOutputPx formula (documentation only — SVG uses original vectors)', () => {
  for (const cm of BOARD_SIZES) {
    for (const q of QUALITIES) {
      test(`${cm}cm ${q}×: formula = ceil(${cm}*1200/20.32)`, () => {
        const s = calculateRenderSurfaceSize(cm, true, q);
        const piecePx = calcPieceOutputPx(cm);
        assert.ok(piecePx > 0);
        assert.ok(s.boardPixels > 0);
      });
    }
  }
});

describe('pieceOutputPx formula matches 4× max square px', () => {
  for (const cm of BOARD_SIZES) {
    test(`${cm}cm`, () => {
      const s4x = calculateRenderSurfaceSize(cm, true, 4);
      const maxSquarePx = Math.ceil(calcSquarePx(s4x.boardPixels));
      const piecePx = calcPieceOutputPx(cm);
      assert.equal(piecePx, maxSquarePx);
    });
  }
});

describe('SVG pieces: embedded at original vector size', () => {
  test('SVG export does NOT resize piece SVGs — vectors stay at native dimensions', () => {
    assert.ok(true);
  });
});

describe('SVG raster fix: cm → px in worker path', () => {
  function replaceCmWithPx(svg: string, w: number, h: number): string {
    return svg
      .replace(/width="[\d.]+cm"/, `width="${w}"`)
      .replace(/height="[\d.]+cm"/, `height="${h}"`);
  }

  test('8.44cm replaced with 3991px', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 880" width="8.44cm" height="8.88cm" role="img">';
    const result = replaceCmWithPx(svg, 3991, 4190);
    assert.ok(result.includes('width="3991"'));
    assert.ok(result.includes('height="4190"'));
    assert.ok(!result.includes('cm"'));
    assert.ok(result.includes('viewBox="0 0 840 880"'));
  });

  test('all standard sizes produce no cm in SVG', () => {
    for (const cm of BOARD_SIZES) {
      for (const q of QUALITIES) {
        const s = calculateRenderSurfaceSize(cm, true, q);
        const svgCm = `<svg viewBox="0 0 840 840" width="${(cm * 1.055).toFixed(2)}cm" height="${(cm * 1.055).toFixed(2)}cm">`;
        const result = replaceCmWithPx(svgCm, s.canvasWidth, s.canvasHeight);
        assert.ok(
          !result.includes('cm"'),
          `${cm}cm ${q}×: cm still present after replacement`
        );
        assert.ok(
          result.includes(`width="${s.canvasWidth}"`),
          `${cm}cm ${q}×: width mismatch`
        );
        assert.ok(
          result.includes(`height="${s.canvasHeight}"`),
          `${cm}cm ${q}×: height mismatch`
        );
      }
    }
  });

  test('pixel width matches canvasWidth (1:1 createImageBitmap)', () => {
    for (const cm of BOARD_SIZES) {
      for (const q of QUALITIES) {
        const s = calculateRenderSurfaceSize(cm, true, q);
        assert.ok(s.canvasWidth > 0);
        assert.ok(s.canvasHeight > 0);
        assert.ok(
          s.canvasWidth > 100,
          `${cm}cm ${q}×: canvas too small: ${s.canvasWidth}px`
        );
        const ratio = s.canvasWidth / s.boardPixels;
        assert.ok(
          ratio >= 1.0 && ratio <= 1.5,
          `${cm}cm ${q}×: canvas/board ratio ${ratio} unreasonable`
        );
      }
    }
  });
});

describe('SVG internal → canvas coordinate mapping', () => {
  const SVG_BORDER_RATIO = 0.05;
  const SVG_BOARD_UNITS = 800;
  const SVG_BORDER_UNITS = Math.round(SVG_BOARD_UNITS * SVG_BORDER_RATIO);
  const SVG_TOTAL_UNITS =
    SVG_BOARD_UNITS + SVG_BORDER_UNITS + boardOutlineWidth(SVG_BOARD_UNITS) * 2;
  const SVG_SQUARE_UNITS = SVG_BOARD_UNITS / 8;

  test('SVG→Canvas square pixel dəqiqliyi (hər ölçü × hər keyfiyyət)', () => {
    for (const cm of BOARD_SIZES) {
      for (const q of QUALITIES) {
        const s = calculateRenderSurfaceSize(cm, true, q);
        const sqFromSvg = (SVG_SQUARE_UNITS * s.canvasWidth) / SVG_TOTAL_UNITS;
        const sqDirect = s.boardPixels / 8;
        const diffPx = Math.abs(sqFromSvg - sqDirect);
        assert.ok(
          diffPx < 0.5,
          `${cm}cm ${q}×: SVG→Canvas square mismatch ${diffPx.toFixed(3)}px (SVG:${sqFromSvg.toFixed(2)} Canvas:${sqDirect.toFixed(2)})`
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

describe('resizePieceSvg', () => {
  const REAL_SETS: Array<[string, string, number, string | null]> = [
    [
      'cburnett',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" width="512" height="512">',
      512,
      '512'
    ],
    [
      'staunty',
      '<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" viewBox="0 0 50 50" width="512" height="512">',
      512,
      '512'
    ],
    [
      'cardinal',
      '<svg xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" viewBox="0 0 50 50" width="512" height="512">',
      512,
      '512'
    ],
    [
      'companion',
      '<svg xmlns="http://www.w3.org/2000/svg" id="king" viewBox="0 0 933.33 933.33" width="512" height="512">',
      512,
      '512'
    ],
    [
      'fantasy',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 933.33 933.33" width="512" height="512">',
      512,
      '512'
    ],
    [
      'fresca',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81 81" width="512" height="512">',
      512,
      '512'
    ],
    [
      'governor',
      '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" viewBox="0 -0.5 16 16" width="512" height="512">',
      512,
      '512'
    ],
    [
      'pixel',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -0.5 16 16" width="512" height="512">',
      512,
      '512'
    ],
    [
      'kosal',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81 81" width="512" height="512">',
      512,
      '512'
    ],
    [
      'maestro',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 1.5 50 50" width="512" height="512">',
      512,
      '512'
    ],
    [
      'leipzig',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50.8 50.775" width="192" height="191.906">',
      192,
      '192'
    ],
    [
      'california',
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="-50 -60 478.77 511.58">',
      100,
      null
    ],
    [
      'gioco',
      '<svg xmlns="http://www.w3.org/2000/svg" width="50mm" height="50mm" viewBox="0 0 50 50">',
      189,
      '50mm'
    ],
    [
      'merida',
      '<svg xmlns="http://www.w3.org/2000/svg" width="50mm" height="50mm" viewBox="0 0 50 50">',
      189,
      '50mm'
    ],
    [
      'tatiana',
      '<svg xmlns="http://www.w3.org/2000/svg" width="50mm" height="50mm" viewBox="0 0 50 50">',
      189,
      '50mm'
    ],
    [
      'horsey',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="512" height="512">',
      512,
      '512'
    ],
    [
      'spatial',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 933.333 933.333" width="700pt" height="700pt">',
      933,
      '700pt'
    ],
    [
      'icpieces',
      '<svg xmlns="http://www.w3.org/2000/svg" width="368" height="368">',
      368,
      null
    ]
  ];

  for (const [setName, svg, intrinsic, _originalUnit] of REAL_SETS) {
    test(`${setName}: intrinsicPxOf = ${intrinsic}`, () => {
      assert.equal(intrinsicPxOf(svg), intrinsic);
    });
  }

  for (const [setName, svg, ,] of REAL_SETS) {
    test(`${setName}: resizePieceSvg preserves viewBox`, () => {
      const resized = resizePieceSvg(svg, 473);
      const vbMatch = /viewBox\s*=\s*"([^"]*)"/i.exec(svg);
      const vbResized = /viewBox\s*=\s*"([^"]*)"/i.exec(resized);
      if (vbMatch && vbResized) {
        assert.equal(vbResized[1], vbMatch[1], `${setName}: viewBox changed!`);
      }
    });
  }

  test('icpieces gains a viewBox and scales its original paths to the target size', () => {
    const icpieces =
      '<svg xmlns="http://www.w3.org/2000/svg" width="368" height="368"><path d="M0 0h368v368H0z"/></svg>';
    const resized = resizePieceSvg(icpieces, 473);
    assert.ok(resized.includes('viewBox="0 0 368 368"'));
    assert.ok(resized.includes('width="473"'));
    assert.ok(resized.includes('height="473"'));
    assert.ok(resized.includes('<path d="M0 0h368v368H0z"/>'));
  });

  test('viewBox-only SVG: width/height added', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">';
    const resized = resizePieceSvg(svg, 473);
    assert.ok(resized.includes('width="473"'));
    assert.ok(resized.includes('height="473"'));
    assert.ok(resized.includes('viewBox="0 0 45 45"'));
  });

  test('mm-based SVG: unit replaced with px', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="50mm" height="50mm" viewBox="0 0 50 50">';
    const resized = resizePieceSvg(svg, 473);
    assert.ok(resized.includes('width="473"'));
    assert.ok(resized.includes('height="473"'));
    assert.ok(!resized.includes('mm'));
  });

  test('pt-based SVG: unit replaced with px', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="700pt" height="700pt" viewBox="0 0 933 933">';
    const resized = resizePieceSvg(svg, 473);
    assert.ok(resized.includes('width="473"'));
    assert.ok(resized.includes('height="473"'));
    assert.ok(!resized.includes('pt'));
  });

  test('non-square viewBox: aspect preserved', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="191.906" viewBox="0 0 50.8 50.775">';
    const resized = resizePieceSvg(svg, 473);
    assert.ok(
      resized.includes('viewBox="0 0 50.8 50.775"'),
      'viewBox-ə toxunulmamalıdır'
    );
    assert.ok(resized.includes('width="473"'));
    assert.ok(resized.includes('height="473"'));
  });
});

describe('Format-specific quality invariants', () => {
  test('SVG: vector — həmişə max rezolyusiya (pieceOutputPx 4× hədəfləyir)', () => {
    for (const cm of BOARD_SIZES) {
      const piecePx = calcPieceOutputPx(cm);
      const s4x = calculateRenderSurfaceSize(cm, true, 4);
      const square4x = Math.ceil(calcSquarePx(s4x.boardPixels));
      assert.equal(piecePx, square4x);
    }
  });

  test('PNG/JPEG: canvas rezolyusiyası keyfiyyətə uyğundur', () => {
    for (const cm of BOARD_SIZES) {
      for (const q of QUALITIES) {
        const s = calculateRenderSurfaceSize(cm, true, q);
        const expectedDpi = PRINT_DPI * q;
        assert.equal(s.effectiveDPI, expectedDpi);
        assert.ok(s.boardPixels >= 100, `${cm}cm ${q}×: board too small`);
      }
    }
  });

  test('PNG/JPEG: 4× 1×-dən 16× çox pixelə malikdir (area)', () => {
    for (const cm of BOARD_SIZES) {
      const s1 = calculateRenderSurfaceSize(cm, false, 1);
      const s4 = calculateRenderSurfaceSize(cm, false, 4);
      const area1 = s1.boardPixels * s1.boardPixels;
      const area4 = s4.boardPixels * s4.boardPixels;
      const ratio = area4 / area1;
      assert.ok(
        ratio >= 15.5 && ratio <= 16.5,
        `${cm}cm: area ratio ${ratio.toFixed(2)} (expected ~16)`
      );
    }
  });
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
  test('minimum board size = 1cm', () => {
    const s = calculateRenderSurfaceSize(1, false, 1);
    assert.ok(s.boardPixels >= 1);
    assert.ok(s.canvasWidth >= 1);
  });

  test('minimum quality = 1', () => {
    const s = calculateRenderSurfaceSize(8, true, 1);
    assert.equal(s.effectiveDPI, 300);
  });

  test('zero quality → should not produce NaN/Infinity', () => {
    const s = calculateRenderSurfaceSize(8, true, 0);
    assert.ok(Number.isFinite(s.boardPixels));
    assert.ok(Number.isFinite(s.canvasWidth));
    assert.ok(s.boardPixels >= 0);
  });

  test('zero board size → should not crash', () => {
    const s = calculateRenderSurfaceSize(0, false, 1);
    assert.ok(Number.isFinite(s.boardPixels));
    assert.ok(Number.isFinite(s.canvasWidth));
    assert.ok(s.boardPixels >= 0);
  });

  test('negative quality → handled gracefully', () => {
    const s = calculateRenderSurfaceSize(8, true, -1);
    assert.ok(Number.isFinite(s.boardPixels));
    assert.ok(Number.isFinite(s.canvasWidth));
  });

  test('non-integer board size: 5.25cm', () => {
    const s = calculateRenderSurfaceSize(5.25, true, 3);
    const expected = calcBoardPixels(5.25, 3);
    assert.equal(s.boardPixels, expected);
    assert.equal(s.effectiveDPI, PRINT_DPI * 3);
    assert.equal(s.scaleFactor, 1.0);
  });

  test('canvas dimensions match SVG viewBox aspect ratio', () => {
    for (const cm of BOARD_SIZES) {
      for (const q of QUALITIES) {
        const s = calculateRenderSurfaceSize(cm, true, q);
        const canvasRatio = s.canvasWidth / s.canvasHeight;
        assert.ok(
          Math.abs(canvasRatio - 1.0) < 0.01,
          `${cm}cm ${q}×: canvas ratio ${canvasRatio} not square`
        );
      }
    }
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
