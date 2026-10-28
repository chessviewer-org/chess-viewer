import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STARTING_FEN } from '@chessviewer-org/chess-viewer';
import { positionFromFen } from '../src/engines/rules/moves';
import { searchLine } from '../src/engines/stockfish/output';
import { parseFEN } from '../src/shared/utils/fenParser';
import {
  moveAt,
  moveTokens
} from '../src/components/interactions/Analysis/solutionMoves';

const position = positionFromFen(parseFEN(STARTING_FEN), STARTING_FEN);
const line = (multipv: number, cp: number, pv: string[]) =>
  searchLine(position, 1, { multipv, cp, pv, depth: 10 });

test('a preview follows its line and ply when the engine replaces and reorders results', () => {
  const location = { solutionId: 2, moveIndex: 1 };
  const first = line(2, 30, ['e2e4', 'e7e5']);
  const next = line(2, -125, ['d2d4', 'g8f6']);
  const other = line(1, 50, ['c2c4', 'e7e5']);
  assert.equal(moveAt([first, other], location), first.moves[1]);
  assert.equal(moveAt([other, next], location), next.moves[1]);
  assert.equal(moveAt([other, next], location)?.text, 'Nf6');
  assert.notDeepEqual(first.moves[1]?.board, next.moves[1]?.board);
});

test('move keys survive changing scores, SAN lengths and preceding move numbers', () => {
  const first = line(1, 30, ['e2e4', 'e7e5', 'g1f3']);
  const next = line(1, -125, ['d2d4', 'g8f6', 'b1c3']);
  const moves = (result: typeof first) =>
    moveTokens(result.key, result.moves).filter((part) => part.move);
  assert.deepEqual(
    moves(first).map((part) => part.key),
    moves(next).map((part) => part.key)
  );
  assert.deepEqual(
    moves(next).map((part) => part.moveIndex),
    [0, 1, 2]
  );
  assert.equal(
    moveTokens(next.key, next.moves)
      .map((part) => part.text)
      .join(''),
    next.key
  );
});

test('variation previews resolve within the owning solution and disappear when removed', () => {
  const first = line(1, 30, ['e2e4', 'e7e5']);
  const variation = line(2, 20, ['d2d4', 'g8f6']);
  first.variations = [{ id: 7, text: variation.key, moves: variation.moves }];
  const location = { solutionId: 1, variationId: 7, moveIndex: 1 };
  assert.equal(moveAt([first], location), variation.moves[1]);
  assert.equal(moveAt([first], { ...location, variationId: 8 }), undefined);
  assert.equal(moveAt([first], { ...location, moveIndex: 5 }), undefined);
  assert.equal(moveAt([], location), undefined);
});
