import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  FAIRY_WALKS,
  FAIRY_ATTRIBUTES
} from '../src/shared/constants/fairyCatalogue.ts';
import { namedCell, parseNamedCell } from '../src/shared/utils/fairyCells.ts';
import {
  parseFEN,
  positionContext,
  serializePosition,
  validateFEN,
  normalizePositionFEN
} from '../src/shared/utils/fenParser.ts';
import { parsePopeye, serializePopeye } from '../src/shared/utils/popeye.ts';
import { getPieceKey, piecePath } from '../src/shared/utils/pieceUtils.ts';
import { positionPieceCounts } from '../src/shared/utils/boardCells.ts';
import {
  compositionCaption,
  compositionCaptionLayout
} from '../src/shared/utils/compositionCaption.ts';
import {
  fairyDiagramPieces,
  generatePositionLatex
} from '../src/shared/utils/fairyLatex.ts';
import { generatePositionPreview } from '../src/pages/LatexPage/utils/fairyPreview.ts';
import {
  createPosition,
  parseBulkInput,
  sanitizeProject
} from '../src/pages/LatexPage/utils/latexProject.ts';

const SOURCE = `BeginProblem
Author A. Composer
Stipulation h#2
Condition Circe
Pieces White Ke1 Ge4
Pieces Black Ke8 Ne5
Pieces Neutral PAa4
EndProblem`;

describe('Popeye composition notation', () => {
  test('uses Popeye N for nightrider and S for orthodox knight', () => {
    const board = parseFEN(SOURCE);
    assert.equal(board[4]?.[4], 'w@G');
    assert.equal(board[3]?.[4], 'b@N');
    assert.equal(board[4]?.[0], 'n@PA');
    const knight = parseFEN('BeginProblem Pieces White Sc3 EndProblem');
    assert.equal(knight[5]?.[2], 'N');
    assert.ok(validateFEN(SOURCE));
    assert.deepEqual(parseFEN(normalizePositionFEN(SOURCE)), board);
    assert.match(normalizePositionFEN(SOURCE), /condition Circe/);
  });
  test('every catalogue walk and attribute retains identity across saving', () => {
    for (const color of ['w', 'b', 'n'] as const) {
      for (const walk of FAIRY_WALKS) {
        const cell = namedCell(color, walk.code);
        const board = Array.from({ length: 8 }, () =>
          Array<string>(8).fill('')
        );
        board[3]![3] = cell;
        const source = serializePopeye(board);
        assert.equal(parseFEN(source)[3]?.[3], cell, `${color} ${walk.code}`);
        assert.ok(getPieceKey(cell), walk.code);
        assert.ok(piecePath('cburnett', cell), walk.code);
      }
      for (const attribute of FAIRY_ATTRIBUTES) {
        const cell = namedCell(color, 'G', [attribute]);
        const source = `BeginProblem\nPieces ${{ w: 'White', b: 'Black', n: 'Neutral' }[color]} ${attribute} Ge4\nEndProblem`;
        assert.equal(parseFEN(source)[4]?.[4], cell);
        assert.equal(parseNamedCell(cell)?.attributes[0], attribute);
      }
    }
  });
  test('reads official Forsyth examples, optional rank separators and neutral prefixes', () => {
    assert.ok(validateFEN('BeginProblem\nForsyth 48/5gPp/5K1k\nEndProblem'));
    const mach = parseFEN(
      'BeginProblem\nForsyth 1.PA6/8/1Q2.ma3/8/k1.pa.pa4/8/1P1K\nEndProblem'
    );
    assert.equal(mach[0]?.[1], 'w@PA');
    assert.equal(mach[2]?.[4], 'b@MA');
    assert.equal(mach[6]?.[3], 'K');
    const neutral = parseFEN('BeginProblem\nForsyth =.li63\nEndProblem');
    assert.equal(neutral[0]?.[0], 'n@LI');
  });
  test('mixing visual symbols and real walks preserves both and FEN fields', () => {
    const board = parseFEN(SOURCE);
    board[2]![2] = 'nB90';
    const context = { ...positionContext(SOURCE), fenMetadata: 'b - - 12 34' };
    const source = serializePosition(board, context);
    assert.deepEqual(parseFEN(source), board);
    assert.equal(positionContext(source).fenMetadata, 'b - - 12 34');
    assert.match(source, /ChessViewerSymbols c6=nB90/);
    assert.equal(
      positionContext(source).commands?.find((c) => c.keyword === 'stipulation')
        ?.value,
      'h#2'
    );
  });

  test('round trips geometric diagram marks without inventing Popeye piece walks', () => {
    const board = parseFEN(SOURCE);
    board[0]![0] = 'wC';
    board[0]![1] = 'bX90';
    board[0]![2] = 'nS180';
    board[0]![3] = 'nT270';
    const source = serializePosition(board, positionContext(SOURCE));
    assert.equal(validateFEN(source), true);
    assert.deepEqual(parseFEN(source), board);
    assert.match(
      source,
      /Remark ChessViewerSymbols a8=wC b8=bX90 c8=nS180 d8=nT270/
    );
    assert.doesNotMatch(source, /Pieces [^\n]*(?:Ca8|Xb8|Sc8|Td8)/);
    assert.equal(
      positionContext(source).commands?.some((command) =>
        /imitator/i.test(command.value)
      ),
      false
    );
    assert.equal(
      validateFEN(
        'BeginProblem\nPieces White Ka1\nRemark ChessViewerSymbols a1=wC\nEndProblem'
      ),
      false
    );
    assert.equal(
      validateFEN('BeginProblem\nRemark ChessViewerSymbols a1=wZ\nEndProblem'),
      false
    );
  });

  test('an Orphan uses a circle glyph while retaining its real walk and piece count', () => {
    const source = 'BeginProblem\nPieces White Oa1\nEndProblem';
    const board = parseFEN(source);
    assert.equal(board[7]?.[0], 'w@O');
    assert.equal(getPieceKey('w@O'), 'wC');
    assert.deepEqual(positionPieceCounts(board), {
      white: 1,
      black: 0,
      neutral: 0
    });
    assert.match(serializePopeye(board), /Pieces White Oa1/);
    assert.doesNotMatch(serializePopeye(board), /ChessViewerSymbols/);
  });
  test('rejects malformed and overlapping input instead of silently losing it', () => {
    for (const source of [
      'BeginProblem\nBeginProblem\nEndProblem',
      'BeginProblem\nEndProblem\nPieces White Ka1\nEndProblem',
      'BeginProblem\nPieces White Ge9\nEndProblem',
      'BeginProblem\nPieces White Unknowna1\nEndProblem',
      'BeginProblem\nPieces White Ga1 Black Na1\nEndProblem',
      'BeginProblem\nForsyth 65\nEndProblem',
      'BeginProblem\nPieces White G\nEndProblem'
    ])
      assert.equal(validateFEN(source), false, source);
  });
  test('keeps metadata and twins as text and outputs a composition legend', () => {
    const source = SOURCE.replace(
      'EndProblem',
      'Twin b) move e4 e3\nEndProblem'
    );
    assert.equal(parsePopeye(source).commands.at(-1)?.value, 'b) move e4 e3');
    const lines = compositionCaption(source);
    assert.ok(lines.some((line) => line.includes('Grasshopper (G): e4')));
    assert.ok(lines.some((line) => line.includes('Circe')));
    assert.ok(lines.some((line) => line.includes('Twin: b) move')));
    const layout = compositionCaptionLayout(source, 800);
    assert.ok(layout.height > 0);
    assert.ok(layout.lines.every((line) => line.length <= 54));
  });
  test('LaTeX uses real diagram glyphs and labelled field text for unassigned symbols', () => {
    const source = SOURCE.replace('Ge4', 'Ge4 NAf4');
    const pieces = fairyDiagramPieces(source);
    assert.match(pieces, /wDUe4/);
    assert.match(pieces, /sSUe5/);
    assert.match(pieces, /\\fieldtext\{\{wNA\}f4\}/);
    const output = generatePositionLatex({
      positions: [{ fen: source }],
      latexPackage: 'diagram'
    });
    assert.match(output, /\\pieces/);
    assert.match(output, /Circe/);
    assert.match(output, /Grasshopper/);
    assert.doesNotMatch(output, /\\fen\[/);
    const svg = generatePositionPreview({ fen: source });
    assert.match(svg, />NA<\/text>/);
  });
  test('studio preserves full compositions through multiline import and persistence', () => {
    const source = SOURCE.replace(
      'EndProblem',
      `Remark ${'Long text '.repeat(90)}\nEndProblem`
    );
    const positions = parseBulkInput(`${source}\n${SOURCE}`);
    assert.equal(positions.length, 2);
    assert.equal(positions[0]?.fen, source);
    const position = createPosition(source);
    assert.equal(
      sanitizeProject({ positions: [position], selectedId: position.id })
        .positions[0]?.fen,
      source
    );
  });
});
