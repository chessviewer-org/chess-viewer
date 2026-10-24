import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  DEFAULT_SETTINGS,
  createDefaultProject,
  createPosition
} from '../src/pages/LatexPage/utils/latexProject.ts';
import {
  boardWidthMm,
  estimateFit
} from '../src/pages/LatexPage/utils/layoutFit.ts';
import {
  PROJECT_FILE_MAX_BYTES,
  parseProjectFile,
  serializeProject
} from '../src/pages/LatexPage/utils/projectFile.ts';

const ENDGAME_FEN = '8/8/8/3k4/8/4K3/3Q4/8 w - - 0 1';

describe('layout fit', () => {
  test('measures snippets against a standard article text width', () => {
    const fit = estimateFit({
      ...DEFAULT_SETTINGS,
      latexPackage: 'chessboard',
      mode: 'snippet',
      columns: 2
    });
    assert.equal(fit.fits, false);
    assert.equal(fit.maxColumns, 1);
  });

  test('reports a fitting layout', () => {
    const fit = estimateFit({
      ...DEFAULT_SETTINGS,
      latexPackage: 'chessboard',
      boardSize: 'tiny',
      showMover: false,
      columns: 3
    });
    assert.equal(fit?.fits, true);
    assert.equal(fit?.maxColumns, 4);
  });

  test('flags boards wider than their column and suggests a column count', () => {
    const fit = estimateFit({
      ...DEFAULT_SETTINGS,
      latexPackage: 'chessboard',
      boardSize: 'large',
      columns: 2
    });
    assert.equal(fit?.fits, false);
    assert.equal(fit?.maxColumns, 1);
  });

  test('reports zero columns when even one cannot hold the board', () => {
    const fit = estimateFit({
      ...DEFAULT_SETTINGS,
      latexPackage: 'chessboard',
      boardSize: 'large',
      paper: 'a5',
      marginMm: 50,
      columns: 1
    });
    assert.equal(fit?.fits, false);
    assert.equal(fit?.maxColumns, 0);
  });

  test('accounts for the side-to-move marker', () => {
    const base = { ...DEFAULT_SETTINGS, latexPackage: 'chessboard' as const };
    assert.ok(
      boardWidthMm({ ...base, showMover: true }) >
        boardWidthMm({ ...base, showMover: false })
    );
  });

  test('standalone figures use a fixed text width', () => {
    const a = estimateFit({
      ...DEFAULT_SETTINGS,
      mode: 'standalone',
      paper: 'a5'
    });
    const b = estimateFit({
      ...DEFAULT_SETTINGS,
      mode: 'standalone',
      paper: 'a4'
    });
    assert.equal(a?.cellMm, b?.cellMm);
  });
});

describe('project files', () => {
  test('round-trips a project', () => {
    const project = createDefaultProject();
    const extra = createPosition(ENDGAME_FEN, { author: 'Loyd, Sam' });
    const full = { ...project, positions: [...project.positions, extra] };
    const restored = parseProjectFile(serializeProject(full));
    assert.equal(restored?.positions.length, 2);
    assert.equal(restored?.positions[1]?.author, 'Loyd, Sam');
    assert.deepEqual(restored?.settings, full.settings);
  });

  test('rejects text that is not a project', () => {
    for (const text of ['', 'nope', '[]', '{"positions":"x"}', '42']) {
      assert.equal(parseProjectFile(text), null);
    }
  });

  test('rejects oversized files', () => {
    assert.equal(
      parseProjectFile('x'.repeat(PROJECT_FILE_MAX_BYTES + 1)),
      null
    );
  });

  test('sanitises hostile values from a file', () => {
    const restored = parseProjectFile(
      JSON.stringify({
        positions: [{ fen: ENDGAME_FEN, squareColor: 'url(evil)' }],
        settings: { latexPackage: '../../x' }
      })
    );
    assert.equal(restored?.positions[0]?.squareColor, '#ffeb3b');
    assert.equal(
      restored?.settings.latexPackage,
      DEFAULT_SETTINGS.latexPackage
    );
  });
});
