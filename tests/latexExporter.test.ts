import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  LATEX_PACKAGES,
  LATEX_PACKAGE_META,
  generateBoardLatex,
  isLatexPackage
} from '@utils/latexExporter';

// Constants
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const TACTIC_FEN =
  'r5k1/1b1p1ppp/p7/1p1Q4/2p1r3/PP4Pq/BBP2b1P/R4R1K w - - 0 20';

describe('package metadata', () => {
  test('exposes exactly the two packages from the feature scope', () => {
    assert.deepEqual([...LATEX_PACKAGES], ['skak', 'chessboard']);
  });

  test('each package carries its own \\usepackage line', () => {
    assert.equal(LATEX_PACKAGE_META.skak.usePackage, '\\usepackage{skak}');
    assert.equal(
      LATEX_PACKAGE_META.chessboard.usePackage,
      '\\usepackage{chessboard}'
    );
  });

  test('isLatexPackage accepts supported ids', () => {
    assert.equal(isLatexPackage('skak'), true);
    assert.equal(isLatexPackage('chessboard'), true);
  });

  test('isLatexPackage rejects anything else', () => {
    assert.equal(isLatexPackage('xskak'), false);
    assert.equal(isLatexPackage(''), false);
    assert.equal(isLatexPackage(null), false);
    assert.equal(isLatexPackage(42), false);
  });
});

describe('skak output', () => {
  test('matches the documented three-line snippet', () => {
    const latex = generateBoardLatex({ fen: START_FEN, latexPackage: 'skak' });
    assert.equal(
      latex,
      ['\\usepackage{skak}', `\\fenboard{${START_FEN}}`, '\\showboard'].join(
        '\n'
      )
    );
  });

  test('skak is the default package', () => {
    assert.equal(
      generateBoardLatex({ fen: START_FEN }),
      generateBoardLatex({ fen: START_FEN, latexPackage: 'skak' })
    );
  });

  test('flipped board uses \\showinverseboard', () => {
    const latex = generateBoardLatex({
      fen: TACTIC_FEN,
      latexPackage: 'skak',
      flipped: true
    });
    assert.match(latex, /\\showinverseboard$/);
    assert.ok(!latex.includes('\\showboard'));
  });

  test('unflipped board never emits the inverse command', () => {
    const latex = generateBoardLatex({
      fen: TACTIC_FEN,
      latexPackage: 'skak',
      flipped: false
    });
    assert.ok(latex.includes('\\showboard'));
    assert.ok(!latex.includes('\\showinverseboard'));
  });

  test('hidden coordinates emit \\notationoff before the diagram', () => {
    const lines = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'skak',
      showCoords: false
    }).split('\n');
    assert.deepEqual(lines, [
      '\\usepackage{skak}',
      `\\fenboard{${START_FEN}}`,
      '\\notationoff',
      '\\showboard'
    ]);
  });

  test('visible coordinates leave the notation switch untouched', () => {
    const latex = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'skak',
      showCoords: true
    });
    assert.ok(!latex.includes('\\notationoff'));
  });

  test('flip and hidden coordinates combine', () => {
    const lines = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'skak',
      flipped: true,
      showCoords: false
    }).split('\n');
    assert.deepEqual(lines.slice(2), ['\\notationoff', '\\showinverseboard']);
  });

  test('chessboard keys never appear in skak output', () => {
    const latex = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'skak',
      flipped: true,
      showCoords: false
    });
    assert.ok(!latex.includes('setfen'));
    assert.ok(!latex.includes('inverse=true'));
    assert.ok(!latex.includes('label=false'));
  });
});

describe('chessboard output', () => {
  test('matches the documented two-line snippet', () => {
    const latex = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'chessboard'
    });
    assert.equal(
      latex,
      ['\\usepackage{chessboard}', `\\chessboard[setfen=${START_FEN}]`].join(
        '\n'
      )
    );
  });

  test('flipped board adds inverse=true', () => {
    const latex = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'chessboard',
      flipped: true
    });
    assert.deepEqual(latex.split('\n'), [
      '\\usepackage{chessboard}',
      '\\chessboard[',
      `  setfen=${START_FEN},`,
      '  inverse=true',
      ']'
    ]);
  });

  test('hidden coordinates add label=false', () => {
    const latex = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'chessboard',
      showCoords: false
    });
    assert.ok(latex.includes('  label=false'));
  });

  test('every key but the last carries a trailing comma', () => {
    const lines = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'chessboard',
      flipped: true,
      showCoords: false
    }).split('\n');

    assert.equal(lines[1], '\\chessboard[');
    assert.equal(lines[lines.length - 1], ']');
    assert.deepEqual(lines.slice(2, -1), [
      `  setfen=${START_FEN},`,
      '  inverse=true,',
      '  label=false'
    ]);
  });

  test('default options emit no optional keys at all', () => {
    const latex = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'chessboard'
    });
    assert.ok(!latex.includes('inverse'));
    assert.ok(!latex.includes('label'));
  });

  test('the single-key form stays on one line', () => {
    const lines = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'chessboard'
    }).split('\n');
    assert.equal(lines.length, 2);
  });
});

describe('output modes', () => {
  test('snippet mode is the default', () => {
    assert.equal(
      generateBoardLatex({ fen: START_FEN, mode: 'snippet' }),
      generateBoardLatex({ fen: START_FEN })
    );
  });

  test('document mode wraps the diagram in a compilable file', () => {
    const lines = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'chessboard',
      mode: 'document'
    }).split('\n');

    assert.deepEqual(lines, [
      '\\documentclass{article}',
      '\\usepackage{chessboard}',
      '\\begin{document}',
      `\\chessboard[setfen=${START_FEN}]`,
      '\\end{document}'
    ]);
  });

  test('document mode keeps skak options inside the body', () => {
    const lines = generateBoardLatex({
      fen: START_FEN,
      latexPackage: 'skak',
      flipped: true,
      mode: 'document'
    }).split('\n');

    assert.deepEqual(lines, [
      '\\documentclass{article}',
      '\\usepackage{skak}',
      '\\begin{document}',
      `\\fenboard{${START_FEN}}`,
      '\\showinverseboard',
      '\\end{document}'
    ]);
  });

  test('output never ends with a newline or trailing space', () => {
    for (const latexPackage of LATEX_PACKAGES) {
      for (const mode of ['snippet', 'document'] as const) {
        const latex = generateBoardLatex({
          fen: START_FEN,
          latexPackage,
          mode
        });
        assert.equal(latex, latex.trimEnd());
      }
    }
  });
});

describe('FEN handling', () => {
  test('a placement-only FEN is completed before it is written out', () => {
    const latex = generateBoardLatex({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
    });
    assert.ok(
      latex.includes(
        '\\fenboard{rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1}'
      )
    );
  });

  test('surrounding whitespace is trimmed', () => {
    assert.equal(
      generateBoardLatex({ fen: `  ${START_FEN}  ` }),
      generateBoardLatex({ fen: START_FEN })
    );
  });

  test('an empty FEN is rejected', () => {
    assert.throws(() => generateBoardLatex({ fen: '' }), /FEN is missing/);
    assert.throws(() => generateBoardLatex({ fen: '   ' }), /FEN is missing/);
  });

  test('a malformed FEN is rejected behind the export error prefix', () => {
    assert.throws(
      () => generateBoardLatex({ fen: 'not-a-position at all' }),
      /LaTeX export failed:/
    );
  });

  test('a FEN with too many ranks is rejected', () => {
    assert.throws(
      () => generateBoardLatex({ fen: '8/8/8/8/8/8/8/8/8 w - - 0 1' }),
      /LaTeX export failed:/
    );
  });

  test('a command injection attempt never reaches the output', () => {
    assert.throws(
      () =>
        generateBoardLatex({
          fen: '8/8/8/8/8/8/8/8 w - - 0 1} \\input{/etc/passwd'
        }),
      /LaTeX export failed:/
    );
  });

  test('braces, backslashes and comment markers are rejected', () => {
    for (const hostile of [
      '\\write18{rm -rf /}',
      '8/8/8/8/8/8/8/8 w - - 0 {1}',
      '8/8/8/8/8/8/8/8 w - - 0 1%comment'
    ]) {
      assert.throws(
        () => generateBoardLatex({ fen: hostile }),
        /LaTeX export failed:/
      );
    }
  });

  test('a non-string FEN is rejected', () => {
    assert.throws(
      () => generateBoardLatex({ fen: null as unknown as string }),
      /FEN is missing/
    );
  });

  test('an unsupported package is rejected', () => {
    assert.throws(
      () =>
        generateBoardLatex({
          fen: START_FEN,
          latexPackage: 'xskak' as unknown as 'skak'
        }),
      /unsupported package/
    );
  });

  test('a real game position survives both packages unchanged', () => {
    assert.ok(
      generateBoardLatex({ fen: TACTIC_FEN }).includes(
        `\\fenboard{${TACTIC_FEN}}`
      )
    );
    assert.ok(
      generateBoardLatex({
        fen: TACTIC_FEN,
        latexPackage: 'chessboard'
      }).includes(`setfen=${TACTIC_FEN}`)
    );
  });
});
