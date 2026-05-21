import assert from 'node:assert/strict';
import test from 'node:test';

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
