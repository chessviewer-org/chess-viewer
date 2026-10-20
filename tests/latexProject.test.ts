import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  DEFAULT_SETTINGS,
  addPositions,
  buildLatex,
  createDefaultProject,
  createPosition,
  fenProblem,
  importIncoming,
  parseArrowList,
  parseBulkInput,
  parseSquareList,
  positionAnnotations,
  sanitizeProject,
  usableFen
} from '../src/pages/LatexPage/utils/latexProject.ts';
import { tokenizeLatexLine } from '../src/pages/LatexPage/utils/latexSyntax.ts';
import { latexRequirements } from '../src/pages/LatexPage/utils/latexRequirements.ts';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const ENDGAME_FEN = '8/8/8/3k4/8/4K3/3Q4/8 w - - 0 1';

describe('square and arrow parsing', () => {
  test('accepts separators, lowercases and de-duplicates squares', () => {
    assert.deepEqual(parseSquareList('E4, d5;e4  f7'), {
      squares: ['e4', 'd5', 'f7'],
      invalid: []
    });
  });

  test('reports invalid squares without dropping the valid ones', () => {
    assert.deepEqual(parseSquareList('e4 z9 a0'), {
      squares: ['e4'],
      invalid: ['z9', 'a0']
    });
  });

  test('parses arrows written with or without a separator', () => {
    assert.deepEqual(parseArrowList('e2-e4 g1f3 b1>c3').arrows, [
      { from: 'e2', to: 'e4' },
      { from: 'g1', to: 'f3' },
      { from: 'b1', to: 'c3' }
    ]);
  });

  test('rejects malformed and zero-length arrows', () => {
    assert.deepEqual(parseArrowList('e2-e2 e2 x1-y2').invalid, [
      'e2-e2',
      'e2',
      'x1-y2'
    ]);
  });
});

describe('FEN checks', () => {
  test('accepts a full FEN and a bare placement field', () => {
    assert.equal(usableFen(START_FEN), START_FEN);
    assert.ok(usableFen('8/8/8/3k4/8/4K3/3Q4/8'));
    assert.equal(fenProblem(START_FEN), null);
  });

  test('rejects empty and malformed FEN with a reason', () => {
    assert.equal(usableFen(''), null);
    assert.equal(usableFen('garbage'), null);
    assert.equal(fenProblem(''), 'FEN is empty');
    assert.ok(fenProblem('8/8/8'));
  });
});

describe('annotations', () => {
  test('maps the text fields to highlights and arrows with colours', () => {
    const position = createPosition(START_FEN, {
      squares: 'e4',
      rings: 'f7',
      arrows: 'e2-e4',
      squareColor: '#112233',
      ringColor: '#445566',
      arrowColor: '#778899'
    });
    assert.deepEqual(positionAnnotations(position), {
      highlights: [
        { square: 'e4', color: '#112233', style: 'fill' },
        { square: 'f7', color: '#445566', style: 'ring' }
      ],
      arrows: [{ from: 'e2', to: 'e4', color: '#778899' }]
    });
  });
});

describe('buildLatex', () => {
  test('builds a document from the default project', () => {
    const { code, error, skipped } = buildLatex(createDefaultProject());
    assert.equal(error, null);
    assert.equal(skipped.length, 0);
    assert.match(code, /\\documentclass/);
    assert.match(code, /\\fen\[16\+16\]/);
  });

  test('skips invalid positions and reports why', () => {
    const project = createDefaultProject();
    const broken = createPosition('nonsense');
    const result = buildLatex({
      ...project,
      positions: [project.positions[0]!, broken]
    });
    assert.equal(result.error, null);
    assert.equal(result.skipped.length, 1);
    assert.equal(result.skipped[0]?.id, broken.id);
    assert.equal(result.skipped[0]?.index, 1);
    assert.equal((result.code.match(/\\begin\{diagram\}/g) ?? []).length, 1);
  });

  test('fails with a clear message when nothing is valid', () => {
    const project = createDefaultProject();
    const result = buildLatex({
      ...project,
      positions: [createPosition('nonsense')]
    });
    assert.equal(result.code, '');
    assert.match(result.error ?? '', /at least one valid position/);
  });

  test('carries package, layout and metadata into the markup', () => {
    const project = createDefaultProject();
    const position = createPosition(ENDGAME_FEN, {
      author: 'Loyd, Sam',
      stipulation: '#2',
      solution: '1.Qd2-c3!',
      squares: 'e4'
    });
    const result = buildLatex({
      ...project,
      positions: [position],
      selectedId: position.id,
      settings: {
        ...DEFAULT_SETTINGS,
        latexPackage: 'chessboard',
        columns: 1,
        title: 'Collection'
      }
    });
    assert.match(result.code, /\\usepackage\{chessboard\}/);
    assert.match(result.code, /markfields=\{e4\}/);
    assert.match(result.code, /\\title\{Collection\}/);
    assert.match(result.code, /\\section\*\{Solutions\}/);
  });
});

describe('bulk input', () => {
  test('reads FEN with optional author, source and stipulation', () => {
    const parsed = parseBulkInput(
      `${ENDGAME_FEN} | Loyd, Sam | Chess Monthly | #2\n\nnot a fen\n${START_FEN}`
    );
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0]?.author, 'Loyd, Sam');
    assert.equal(parsed[0]?.source, 'Chess Monthly');
    assert.equal(parsed[0]?.stipulation, '#2');
    assert.equal(parsed[1]?.fen, START_FEN);
  });

  test('gives every position a unique id', () => {
    const parsed = parseBulkInput(`${START_FEN}\n${START_FEN}\n${START_FEN}`);
    assert.equal(new Set(parsed.map((p) => p.id)).size, 3);
  });
});

describe('project sanitising', () => {
  test('falls back to the default project for junk', () => {
    for (const junk of [null, 'x', 5, [], {}, { positions: 'no' }]) {
      assert.equal(sanitizeProject(junk).positions.length, 1);
    }
  });

  test('keeps valid positions and repairs unsafe values', () => {
    const project = sanitizeProject({
      selectedId: 'missing',
      positions: [
        { id: 'a', fen: START_FEN, squareColor: 'javascript:alert(1)' },
        { id: 'a', fen: ENDGAME_FEN, author: 'x'.repeat(9000) },
        { nope: true }
      ],
      settings: {
        latexPackage: 'evil',
        columns: 99,
        fontSize: 13,
        marginMm: -4,
        numbering: 'yes'
      }
    });
    assert.equal(project.positions.length, 2);
    assert.notEqual(project.positions[0]?.id, project.positions[1]?.id);
    assert.equal(project.selectedId, project.positions[0]?.id);
    assert.equal(project.positions[0]?.squareColor, '#ffeb3b');
    assert.equal(project.positions[1]?.author.length, 500);
    assert.deepEqual(project.settings, DEFAULT_SETTINGS);
  });
});

describe('importing positions', () => {
  test('replaces the untouched placeholder position', () => {
    const project = createDefaultProject();
    const incoming = [createPosition(ENDGAME_FEN)];
    const merged = importIncoming(project, incoming);
    assert.equal(merged.positions.length, 1);
    assert.equal(merged.positions[0]?.fen, ENDGAME_FEN);
    assert.equal(merged.selectedId, incoming[0]?.id);
  });

  test('appends to a project that already has work in it', () => {
    const base = createDefaultProject();
    const edited = {
      ...base,
      positions: [{ ...base.positions[0]!, author: 'Loyd, Sam' }]
    };
    const merged = importIncoming(edited, [createPosition(ENDGAME_FEN)]);
    assert.equal(merged.positions.length, 2);
  });

  test('does not add a position that is already in the project', () => {
    const base = createDefaultProject();
    const edited = {
      ...base,
      positions: [{ ...base.positions[0]!, author: 'Loyd, Sam' }]
    };
    const merged = importIncoming(edited, [createPosition(START_FEN)]);
    assert.equal(merged.positions.length, 1);
    assert.equal(merged.selectedId, edited.positions[0]?.id);
  });

  test('addPositions selects the first new position', () => {
    const base = createDefaultProject();
    const added = [createPosition(ENDGAME_FEN), createPosition(START_FEN)];
    const merged = addPositions(base, added);
    assert.equal(merged.positions.length, 3);
    assert.equal(merged.selectedId, added[0]?.id);
  });
});

describe('syntax tokens', () => {
  test('splits commands, keys and brackets', () => {
    const tokens = tokenizeLatexLine('\\chessboard[setfen=8/8]');
    assert.deepEqual(
      tokens.map((t) => [t.kind, t.text]),
      [
        ['command', '\\chessboard'],
        ['bracket', '['],
        ['key', 'setfen'],
        ['text', '=8/8'],
        ['bracket', ']']
      ]
    );
  });

  test('treats escaped symbols as commands and reassembles the line', () => {
    const line = '\\textbf{\\#2}\\quad (16+16)';
    const tokens = tokenizeLatexLine(line);
    assert.ok(tokens.some((t) => t.kind === 'command' && t.text === '\\#'));
    assert.equal(tokens.map((t) => t.text).join(''), line);
  });
});

describe('requirements', () => {
  test('lists the TeX packages each configuration needs', () => {
    assert.deepEqual(
      latexRequirements({ ...DEFAULT_SETTINGS, mode: 'document' }).packages,
      ['chess-problem-diagrams', 'geometry']
    );
    assert.deepEqual(
      latexRequirements({
        ...DEFAULT_SETTINGS,
        latexPackage: 'skak',
        mode: 'standalone'
      }).packages,
      ['skak', 'standalone']
    );
    assert.deepEqual(
      latexRequirements({
        ...DEFAULT_SETTINGS,
        latexPackage: 'chessboard',
        mode: 'snippet'
      }).packages,
      ['chessboard']
    );
  });

  test('builds the install and compile commands', () => {
    const requirements = latexRequirements(DEFAULT_SETTINGS);
    assert.equal(
      requirements.install,
      'tlmgr install chess-problem-diagrams geometry bartel-chess-fonts pgf xstring'
    );
    assert.equal(
      latexRequirements({
        ...DEFAULT_SETTINGS,
        latexPackage: 'skak',
        mode: 'standalone'
      }).install,
      'tlmgr install skak standalone chessfss lambda-lists skaknew varwidth'
    );
    assert.equal(requirements.compile('book'), 'pdflatex book.tex');
  });
});

describe('appending positions', () => {
  test('replaces the untouched placeholder and otherwise appends', async () => {
    const { appendPositions, isPlaceholderProject } =
      await import('../src/pages/LatexPage/utils/latexProject.ts');
    const base = createDefaultProject();
    assert.equal(isPlaceholderProject(base), true);
    const first = appendPositions(base, [createPosition(ENDGAME_FEN)]);
    assert.equal(first.positions.length, 1);
    assert.equal(first.positions[0]?.fen, ENDGAME_FEN);
    const second = appendPositions(first, [createPosition(ENDGAME_FEN)]);
    assert.equal(second.positions.length, 2);
  });

  test('never grows past 100 positions', () => {
    const base = createDefaultProject();
    const many = Array.from({ length: 150 }, () => createPosition(ENDGAME_FEN));
    assert.equal(addPositions(base, many).positions.length, 100);
    assert.equal(
      parseBulkInput(Array(150).fill(ENDGAME_FEN).join('\n')).length,
      100
    );
  });
});

describe('caption styles', () => {
  const GAME_FEN =
    'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 4';

  test('new projects use the problem layout', () => {
    assert.equal(createDefaultProject().settings.captionStyle, 'problem');
  });

  test('passes game fields and a per-diagram style to the generator', () => {
    const project = {
      ...createDefaultProject(),
      positions: [
        createPosition(GAME_FEN, {
          white: 'Kasparov',
          black: 'Topalov',
          event: 'Wijk aan Zee',
          date: '1999',
          captionStyle: 'game'
        })
      ],
      settings: { ...DEFAULT_SETTINGS, latexPackage: 'chessboard' as const }
    };
    const { code } = buildLatex(project);
    assert.match(code, /Kasparov -- Topalov/);
    assert.match(code, /Wijk aan Zee, 1999/);
    assert.match(code, /Black to move/);
  });

  test('keeps valid styles and drops unknown ones when sanitising', () => {
    const project = sanitizeProject({
      positions: [
        { fen: GAME_FEN, captionStyle: 'game', white: 'Tal' },
        { fen: GAME_FEN, captionStyle: 'fancy' }
      ],
      settings: { captionStyle: 'study' }
    });
    assert.equal(project.settings.captionStyle, 'study');
    assert.equal(project.positions[0]?.captionStyle, 'game');
    assert.equal(project.positions[0]?.white, 'Tal');
    assert.equal(project.positions[1]?.captionStyle, null);
  });

  test('opens projects saved before caption styles existed', () => {
    const project = sanitizeProject({
      positions: [{ fen: GAME_FEN, author: 'Loyd' }],
      settings: {}
    });
    assert.equal(project.settings.captionStyle, 'problem');
    assert.equal(project.positions[0]?.captionStyle, null);
    assert.equal(project.positions[0]?.event, '');
  });
});
