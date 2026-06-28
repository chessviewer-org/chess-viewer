import assert from 'node:assert/strict';
import test from 'node:test';
import fc from 'fast-check';
import { boardToFEN } from './boardUtils';
import { parseFEN } from './fenParser';

import { getFENValidationError, validateFEN } from './fenParser.ts';

test('validates a normal starting position', () => {
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  assert.equal(validateFEN(fen), true);
  assert.equal(getFENValidationError(fen), '');
});

test('returns a readable error for a short rank', () => {
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPP/RNBQKBNR w KQkq - 0 1';
  assert.equal(validateFEN(fen), false);
  assert.match(getFENValidationError(fen), /Rank 7/);
});

test('returns a readable error for a wrong piece character', () => {
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPX/RNBQKBNR w KQkq - 0 1';
  assert.equal(validateFEN(fen), false);
  assert.equal(getFENValidationError(fen), 'Invalid piece character: X');
});

/**
 * Property test for the FEN roundtrip
 *
 * Generates random (not necessarily valid!) 8x8 boards,
 * converts them into FEN with 'boardToFEN',
 * parses them back with 'parseFEN' and asserts they are equal.
 */
test('property: roundtrip from board to FEN and back preserves the board', () => {
  //selects a random piece from the array
  const pieceGenerator = fc.constantFrom(
    'p',
    'n',
    'b',
    'r',
    'q',
    'k',
    'P',
    'N',
    'B',
    'R',
    'Q',
    'K'
  );

  //generates a random board using pieceGenerator
  const boardGenerator = fc.array(
    fc.array(pieceGenerator, { minLength: 8, maxLength: 8 }),
    { minLength: 8, maxLength: 8 }
  );

  fc.assert(
    fc.property(boardGenerator, (board) => {
      const FEN = boardToFEN(board);
      const roundtrip = parseFEN(FEN);
      assert.deepEqual(board, roundtrip);
    })
  );
});
