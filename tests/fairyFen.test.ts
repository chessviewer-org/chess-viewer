import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { MAX_FEN_LENGTH, STARTING_FEN } from '@chessviewer-org/chess-viewer';
import { FAIRY_BOXES } from '@constants/fairyPieces';
import { boardToFEN } from '@utils/boardCells';
import {
  isFairyFEN,
  MAX_POSITION_LENGTH,
  normalizePositionFEN,
  parseFEN,
  validateFEN,
  validateFENDetailed
} from '@utils/fenParser';
import { fairyDiagramPieces, generatePositionLatex } from '@utils/fairyLatex';
import { generatePositionPreview } from '../src/pages/LatexPage/utils/fairyPreview';

const emptyBoard = () =>
  Array.from({ length: 8 }, () => Array<string>(8).fill(''));
const FFEN = '-B7/1*1B6/2-*2r5/3*3q4/8/8/8/8 b - - 12 34';

describe('Fairy FEN (Joost de Heer syntax)', () => {
  test('implements the published neutral and clockwise rotation examples', () => {
    const board = parseFEN(FFEN);
    assert.equal(board[0]?.[0], 'nB');
    assert.equal(board[1]?.[1], 'wB90');
    assert.equal(board[2]?.[2], 'nR180');
    assert.equal(board[3]?.[3], 'bQ270');
    assert.equal(
      `${boardToFEN(board)} b - - 12 34`,
      '-B7/1*1B6/2-*2R5/3*3q4/8/8/8/8 b - - 12 34'
    );
  });

  test('all 72 supported symbols round trip, including unrotated neutral pieces', () => {
    for (const box of FAIRY_BOXES)
      for (const variant of box.variants) {
        const board = emptyBoard();
        board[4]![3] = variant;
        const placement = boardToFEN(board);
        const decoded = parseFEN(placement);
        assert.equal(boardToFEN(decoded), placement, variant);
        assert.equal(validateFEN(`${placement} w - - 0 1`), true, variant);
      }
  });

  test('accepts published composition examples without inventing piece codes', () => {
    // G161, Petko Petkov, feenschach 1993; Janko's FFEN specification.
    const published =
      '4n3/1-*2q2b-qp-*2n/4p-*2qp1/2*2q1pkp-r/4pP*2q1/1p2P2p/1-*2q6/*2q2KB3';
    assert.equal(validateFEN(published), true);
    assert.deepEqual(
      parseFEN(boardToFEN(parseFEN(published))),
      parseFEN(published)
    );
  });

  test('neutral letter case is insignificant, and zero turns are canonicalised', () => {
    assert.deepEqual(
      parseFEN('-q7/8/8/8/8/8/8/8'),
      parseFEN('-Q7/8/8/8/8/8/8/8')
    );
    assert.equal(
      boardToFEN(parseFEN('*0Q7/8/8/8/8/8/8/8')),
      'Q7/8/8/8/8/8/8/8'
    );
  });

  test('rejects truncated prefixes, invalid rotations, overflow and unsupported shapes', () => {
    for (const rank of [
      '-',
      '*',
      '*Q7',
      '*4Q7',
      '*90Q7',
      '--Q7',
      '*2-Q7',
      '-*2',
      '-Q8',
      '-Q6',
      '-X7',
      'nQ7'
    ]) {
      const fen = `${rank}/8/8/8/8/8/8/8 w - - 0 1`;
      assert.equal(validateFEN(fen), false, fen);
      assert.ok(validateFENDetailed(fen).errorMessage, fen);
    }
  });

  test('validates the metadata instead of accepting arbitrary trailing fields', () => {
    for (const metadata of [
      'x - - 0 1',
      'w KK - 0 1',
      'w - a4 0 1',
      'w - - -1 1',
      'w - - 0 0',
      'w -',
      'w - - 0 1 extra'
    ]) {
      assert.equal(
        validateFEN(`-Q7/8/8/8/8/8/8/8 ${metadata}`),
        false,
        metadata
      );
    }
    assert.equal(
      normalizePositionFEN(' -q7/8/8/8/8/8/8/8 '),
      '-Q7/8/8/8/8/8/8/8 w - - 0 1'
    );
  });

  test('accepts a full neutral rotated board while preserving the standard length limit', () => {
    const placement = Array(8).fill('-*3Q'.repeat(8)).join('/');
    const fen = `${placement} w - - 0 1`;
    assert.ok(fen.length > MAX_FEN_LENGTH && fen.length <= MAX_POSITION_LENGTH);
    assert.equal(validateFEN(fen), true);
    assert.equal(boardToFEN(parseFEN(fen)), placement);
    assert.equal(
      validateFEN(`${fen}${' '.repeat(MAX_POSITION_LENGTH)}`),
      false
    );
    assert.equal(
      validateFEN(`${STARTING_FEN}${' '.repeat(MAX_FEN_LENGTH)}`),
      false
    );
  });

  test('standard positions remain standard FEN, and metadata hyphens do not select fairy mode', () => {
    assert.equal(isFairyFEN(STARTING_FEN), false);
    assert.equal(validateFEN(STARTING_FEN), true);
    assert.equal(normalizePositionFEN(STARTING_FEN), STARTING_FEN);
    assert.equal(isFairyFEN(FFEN), true);
  });
});

describe('fairy diagrams in LaTeX Studio', () => {
  test('uses documented German piece names, neutral counts and R/U/L turns', () => {
    assert.equal(
      fairyDiagramPieces(FFEN),
      '\\pieces[1+1+2]{nLa8, wLRb7, nTUc6, sDLd5}'
    );
  });
  test('preserves fairy pieces in the diagram package, with metadata and mixed standard positions', () => {
    const code = generatePositionLatex({
      latexPackage: 'diagram',
      mode: 'snippet',
      positions: [{ fen: FFEN, author: 'Example' }, { fen: STARTING_FEN }]
    });
    assert.match(code, /\\pieces\[1\+1\+2\]/);
    assert.match(code, /\\author\{Example, \}/);
    assert.match(code, /\\fen\[16\+16\]/);
    assert.doesNotMatch(code, /\\fen\[[^\]]*\]\{[^}]*\*/);
  });
  test('refuses packages that cannot represent the selected fairy glyphs', () => {
    assert.throws(
      () =>
        generatePositionLatex({
          latexPackage: 'skak',
          positions: [{ fen: FFEN }]
        }),
      /require.*diagram/
    );
  });
  test('preview contains actual neutral halves and rotations', () => {
    const svg = generatePositionPreview({ fen: FFEN, size: 320 });
    assert.match(svg, /rotate\(90 22.5 22.5\)/);
    assert.match(svg, /rotate\(180 22.5 22.5\)/);
    assert.match(svg, /rotate\(270 22.5 22.5\)/);
    assert.equal((svg.match(/<clipPath /g) ?? []).length, 4);
    assert.equal((svg.match(/<svg x=/g) ?? []).length, 4);
  });
});
