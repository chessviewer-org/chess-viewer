import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  cancelExport,
  checkCancellation,
  exportState,
  getExportInfo,
  pauseExport,
  resetExportState,
  resumeExport,
  validateExportConfig,
  waitWhilePaused
} from '@utils/exportState';

const VALID_CONFIG = {
  boardSize: 8,
  showCoords: true,
  exportQuality: 2,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  lightSquare: '#f0d9b5',
  darkSquare: '#b58863',
  pieceImages: { wK: {} as HTMLImageElement },
  flipped: false
};

describe('validateExportConfig', () => {
  test('valid config does not throw', () => {
    assert.doesNotThrow(() => validateExportConfig(VALID_CONFIG));
  });

  test('null config throws', () => {
    assert.throws(
      () => validateExportConfig(null as unknown as typeof VALID_CONFIG),
      /null or undefined/
    );
  });

  test('undefined config throws', () => {
    assert.throws(
      () => validateExportConfig(undefined as unknown as typeof VALID_CONFIG),
      /null or undefined/
    );
  });

  test('boardSize = 0 throws', () => {
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, boardSize: 0 }),
      /boardSize/
    );
  });

  test('boardSize = 1 is valid', () => {
    assert.doesNotThrow(() =>
      validateExportConfig({ ...VALID_CONFIG, boardSize: 1 })
    );
  });

  test('boardSize = 20 is valid', () => {
    assert.doesNotThrow(() =>
      validateExportConfig({ ...VALID_CONFIG, boardSize: 20 })
    );
  });

  test('empty FEN throws', () => {
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, fen: '' }),
      /FEN/
    );
  });

  test('FEN > 93 chars throws', () => {
    const longFen = 'r'.repeat(94);
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, fen: longFen }),
      /maximum length/
    );
  });

  test('FEN exactly 93 chars is valid', () => {
    const fen93 = VALID_CONFIG.fen.padEnd(93, ' ');
    assert.doesNotThrow(() =>
      validateExportConfig({ ...VALID_CONFIG, fen: fen93 })
    );
  });

  test('missing lightSquare throws', () => {
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, lightSquare: '' }),
      /Square colors/
    );
  });

  test('missing darkSquare throws', () => {
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, darkSquare: '' }),
      /Square colors/
    );
  });

  test('invalid hex lightSquare throws', () => {
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, lightSquare: '#GGGGGG' }),
      /hex/
    );
  });

  test('invalid hex darkSquare throws', () => {
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, darkSquare: '#ZZZZZZ' }),
      /hex/
    );
  });

  test('short hex is invalid', () => {
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, lightSquare: '#fff' }),
      /hex/
    );
  });

  test('no hash prefix is invalid', () => {
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, lightSquare: 'ffffff' }),
      /hex/
    );
  });

  test('null pieceImages throws', () => {
    assert.throws(
      () =>
        validateExportConfig({
          ...VALID_CONFIG,
          pieceImages: null as unknown as Record<string, HTMLImageElement>
        }),
      /pieceImages/
    );
  });

  test('empty pieceImages throws', () => {
    assert.throws(
      () => validateExportConfig({ ...VALID_CONFIG, pieceImages: {} }),
      /empty/
    );
  });

  test('non-object pieceImages throws', () => {
    assert.throws(
      () =>
        validateExportConfig({
          ...VALID_CONFIG,
          pieceImages: 'string' as unknown as Record<string, HTMLImageElement>
        }),
      /not an object/
    );
  });
});

describe('exportState lifecycle', () => {
  test('initial state is not cancelled and not paused', () => {
    resetExportState();
    assert.equal(exportState.cancelled, false);
    assert.equal(exportState.paused, false);
  });

  test('cancel sets cancelled=true, paused=false', () => {
    exportState.paused = true;
    cancelExport();
    assert.equal(exportState.cancelled, true);
    assert.equal(exportState.paused, false);
  });

  test('checkCancellation throws after cancel', () => {
    resetExportState();
    cancelExport();
    assert.throws(() => checkCancellation(), /cancelled/);
  });

  test('checkCancellation does not throw when not cancelled', () => {
    resetExportState();
    assert.doesNotThrow(() => checkCancellation());
  });

  test('pause sets paused=true', () => {
    resetExportState();
    pauseExport();
    assert.equal(exportState.paused, true);
  });

  test('resume sets paused=false', () => {
    resetExportState();
    pauseExport();
    resumeExport();
    assert.equal(exportState.paused, false);
  });

  test('resetExportState clears both flags', () => {
    cancelExport();
    resetExportState();
    assert.equal(exportState.cancelled, false);
    assert.equal(exportState.paused, false);
  });
});

describe('waitWhilePaused', () => {
  for (const [action, release] of [
    ['resume', resumeExport],
    ['cancel', cancelExport]
  ] as const) {
    test(`stays pending until ${action} releases the export`, async () => {
      resetExportState();
      pauseExport();
      let settled = false;
      const waiting = waitWhilePaused().then(() => {
        settled = true;
      });
      await Promise.resolve();
      assert.equal(settled, false);
      release();
      await waiting;
      assert.equal(settled, true);
    });
  }
});

describe('getExportInfo', () => {
  test('returns valid ExportInfo for 8cm 2×', () => {
    const info = getExportInfo(VALID_CONFIG);
    assert.ok(info.canvasWidth > 0);
    assert.ok(info.canvasHeight > 0);
    assert.equal(info.requestedQuality, 2);
    assert.equal(info.effectiveDPI, 600);
    assert.equal(info.physicalSizeCm, 8);
    assert.ok(typeof info.displaySize === 'string');
    assert.ok(info.memoryEstimateMB > 0);
  });

  test('6cm 4× has effectiveDPI 1200', () => {
    const info = getExportInfo({
      ...VALID_CONFIG,
      boardSize: 6,
      exportQuality: 4
    });
    assert.equal(info.effectiveDPI, 1200);
    assert.equal(info.requestedQuality, 4);
    assert.equal(info.physicalSizeCm, 6);
  });

  test('4cm 1× has effectiveDPI 300', () => {
    const info = getExportInfo({
      ...VALID_CONFIG,
      boardSize: 4,
      exportQuality: 1
    });
    assert.equal(info.effectiveDPI, 300);
  });

  test('willBeReduced is false for standard sizes', () => {
    const info = getExportInfo(VALID_CONFIG);
    assert.equal(info.willBeReduced, false);
    assert.ok(info.maxCanvasSize >= info.canvasWidth);
  });

  test('fileSizeEstimates are positive', () => {
    const info = getExportInfo(VALID_CONFIG);
    assert.ok(info.fileSizeEstimates.pngBytes > 0);
    assert.ok(info.fileSizeEstimates.jpegBytes > 0);
  });

  test('larger quality produces larger memory estimate', () => {
    const info1 = getExportInfo({ ...VALID_CONFIG, exportQuality: 1 });
    const info4 = getExportInfo({ ...VALID_CONFIG, exportQuality: 4 });
    assert.ok(info4.memoryEstimateMB > info1.memoryEstimateMB);
  });

  test('physical dimensions are finite', () => {
    const info = getExportInfo(VALID_CONFIG);
    assert.ok(Number.isFinite(info.physicalWidthCm));
    assert.ok(Number.isFinite(info.physicalHeightCm));
    assert.ok(info.physicalWidthCm > 0);
    assert.ok(info.physicalHeightCm > 0);
  });
});
