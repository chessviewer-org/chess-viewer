import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyBoard, STARTING_FEN } from '@chessviewer-org/chess-viewer';
import {
  boardsEqual,
  moveBoardCell,
  positionContextsEqual,
  setBoardCell
} from '../src/components/interactions/Board/boardUpdates';
import { parseFEN, positionContext, serializePosition } from '@utils/fenParser';
import { namedCell, parseNamedCell } from '@utils/fairyCells';

test('placing and removing a piece preserve the source and seven unaffected ranks', () => {
  const board = parseFEN(STARTING_FEN);
  board.forEach(Object.freeze);
  Object.freeze(board);
  const placed = setBoardCell(board, 4, 4, 'nQ270');
  assert.equal(board[4]![4], '');
  assert.equal(placed[4]![4], 'nQ270');
  assert.notEqual(placed[4], board[4]);
  for (let row = 0; row < 8; row++)
    if (row !== 4) assert.equal(placed[row], board[row]);

  const removed = setBoardCell(placed, 4, 4, '');
  assert.equal(placed[4]![4], 'nQ270');
  assert.ok(boardsEqual(removed, board));
});

test('moving between ranks copies two ranks and leaves undo snapshots untouched', () => {
  const board = parseFEN(STARTING_FEN);
  board.forEach(Object.freeze);
  Object.freeze(board);
  const moved = moveBoardCell(board, 6, 4, 4, 4);
  assert.equal(moved[6]![4], '');
  assert.equal(moved[4]![4], 'P');
  assert.equal(board[6]![4], 'P');
  assert.equal(board[4]![4], '');
  assert.equal(moved.filter((rank, row) => rank !== board[row]).length, 2);
  assert.equal(
    serializePosition(moved, positionContext(STARTING_FEN)),
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1'
  );
});

test('a same-rank capture copies one rank without mutating either source cell', () => {
  const board = setBoardCell(
    setBoardCell(createEmptyBoard(), 3, 0, 'R'),
    3,
    7,
    'q'
  );
  board.forEach(Object.freeze);
  Object.freeze(board);
  const moved = moveBoardCell(board, 3, 0, 3, 7);
  assert.equal(moved[3]![0], '');
  assert.equal(moved[3]![7], 'R');
  assert.equal(board[3]![0], 'R');
  assert.equal(board[3]![7], 'q');
  assert.equal(moved.filter((rank, row) => rank !== board[row]).length, 1);
});

test('unchanged actions and invalid destinations preserve board identity', () => {
  const board = parseFEN(STARTING_FEN);
  assert.equal(setBoardCell(board, 6, 4, 'P'), board);
  assert.equal(moveBoardCell(board, 6, 4, 6, 4), board);
  assert.equal(moveBoardCell(board, 4, 4, 3, 4), board);
  for (const invalid of [-1, 8, 1.5, NaN, Infinity]) {
    assert.equal(setBoardCell(board, invalid, 0, 'nK'), board);
    assert.equal(setBoardCell(board, 0, invalid, 'nK'), board);
    assert.equal(moveBoardCell(board, 6, 4, invalid, 4), board);
    assert.equal(moveBoardCell(board, 6, 4, 4, invalid), board);
    assert.equal(moveBoardCell(board, invalid, 4, 4, 4), board);
  }
});

test('neutral and rotated symbols retain their FFEN spelling after a move', () => {
  const board = parseFEN('8/8/8/3-*2B4/8/8/8/8 b - - 3 7');
  const moved = moveBoardCell(board, 3, 3, 4, 5);
  assert.equal(moved[4]![5], 'nB180');
  assert.equal(
    serializePosition(moved, positionContext('8/8/8/3-*2B4/8/8/8/8 b - - 3 7')),
    '8/8/8/8/5-*2B2/8/8/8 b - - 3 7'
  );
});

test('named fairy walks and attributes survive capture and Popeye serialization', () => {
  const cell = namedCell('n', 'G', ['Royal']);
  const board = setBoardCell(
    setBoardCell(createEmptyBoard(), 2, 3, cell),
    5,
    6,
    'p'
  );
  const moved = moveBoardCell(board, 2, 3, 5, 6);
  const metadata = {
    fenMetadata: 'b - - 0 1',
    commands: [{ keyword: 'stipulation', value: 'h#2' }]
  };
  const source = serializePosition(moved, metadata);
  const restored = parseFEN(source);
  assert.equal(restored[2]![3], '');
  assert.equal(restored[5]![6], cell);
  assert.deepEqual(parseNamedCell(restored[5]![6]!)?.attributes, ['Royal']);
  assert.deepEqual(positionContext(source), metadata);
});

test('typed board comparison recognises equivalent imports and decorated cell changes', () => {
  const board = parseFEN(STARTING_FEN);
  assert.ok(boardsEqual(board, parseFEN(STARTING_FEN)));
  assert.ok(boardsEqual(board, board));
  assert.equal(boardsEqual(board, setBoardCell(board, 7, 4, 'nK')), false);
  assert.equal(boardsEqual(board, setBoardCell(board, 7, 4, 'wK90')), false);
});

test('position comparison preserves metadata and Popeye command order and presence', () => {
  const a = {
    fenMetadata: 'w - - 0 1',
    commands: [
      { keyword: 'Stipulation', value: '#2' },
      { keyword: 'Condition', value: 'Circe' }
    ]
  };
  assert.ok(positionContextsEqual(a, structuredClone(a)));
  assert.equal(
    positionContextsEqual(a, { ...a, fenMetadata: 'b - - 0 1' }),
    false
  );
  assert.equal(
    positionContextsEqual(a, { ...a, commands: [...a.commands].reverse() }),
    false
  );
  assert.equal(
    positionContextsEqual(a, {
      ...a,
      commands: [{ keyword: 'Stipulation', value: '#3' }]
    }),
    false
  );
  assert.equal(
    positionContextsEqual(
      { fenMetadata: a.fenMetadata },
      { fenMetadata: a.fenMetadata, commands: [] }
    ),
    false
  );
});
