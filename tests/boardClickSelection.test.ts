import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyBoard, STARTING_FEN } from '@chessviewer-org/chess-viewer';
import {
  resolveBoardClick,
  type PieceSelection
} from '../src/components/interactions/Board/clickSelection';
import {
  moveBoardCell,
  setBoardCell
} from '../src/components/interactions/Board/boardUpdates';
import { parseFEN } from '@utils/fenParser';
import { namedCell } from '@utils/fairyCells';

test('an occupied square selects its source without changing the position', () => {
  const board = parseFEN(STARTING_FEN);
  const snapshot = structuredClone(board);
  assert.deepEqual(resolveBoardClick(board, null, 6, 4), {
    selection: { source: 'board', square: [6, 4] }
  });
  assert.deepEqual(board, snapshot);
  assert.deepEqual(resolveBoardClick(board, null, 4, 4), { selection: null });
});

test('clicking the selected board piece again cancels without a move', () => {
  const board = parseFEN(STARTING_FEN);
  const { selection } = resolveBoardClick(board, null, 6, 4);
  assert.deepEqual(resolveBoardClick(board, selection, 6, 4), {
    selection: null
  });
});

test('the destination moves the original piece once and clears selection', () => {
  const board = parseFEN(STARTING_FEN);
  const { selection } = resolveBoardClick(board, null, 6, 4);
  assert.deepEqual(resolveBoardClick(board, selection, 4, 4), {
    selection: null,
    drop: { piece: 'P', from: [6, 4] }
  });
  const moved = moveBoardCell(board, 6, 4, 4, 4);
  assert.equal(moved[6]?.[4], '');
  assert.equal(moved[4]?.[4], 'P');
  assert.equal(moved.filter((rank, row) => rank !== board[row]).length, 2);
  assert.deepEqual(resolveBoardClick(moved, null, 5, 4), { selection: null });
});

test('the editor can replace either colour without applying chess move legality', () => {
  const board = parseFEN(STARTING_FEN);
  const selection: PieceSelection = { source: 'board', square: [7, 1] };
  for (const [row, col] of [
    [1, 4],
    [7, 4]
  ] as const) {
    assert.deepEqual(resolveBoardClick(board, selection, row, col), {
      selection: null,
      drop: { piece: 'N', from: [7, 1] }
    });
  }
});

test('palette mode replaces an occupied square instead of selecting or moving it', () => {
  const board = parseFEN(STARTING_FEN);
  const selection: PieceSelection = { source: 'palette', piece: 'Q' };
  const result = resolveBoardClick(board, selection, 1, 4);
  assert.equal(result.selection, selection);
  assert.deepEqual(result.drop, { piece: 'Q', from: null });
  assert.deepEqual(resolveBoardClick(board, result.selection, 4, 4), {
    selection,
    drop: { piece: 'Q', from: null }
  });
  assert.equal(board[1]?.[4], 'p');
  assert.equal(board[7]?.[3], 'Q');
});

test('placing the same palette piece is a no-op that retains placement mode', () => {
  const board = parseFEN(STARTING_FEN);
  const selection: PieceSelection = { source: 'palette', piece: 'P' };
  const result = resolveBoardClick(board, selection, 6, 4);
  assert.equal(result.selection, selection);
  assert.equal(result.drop, undefined);
});

test('rotated, neutral and named fairy pieces keep their full identity', () => {
  for (const piece of ['nB180', 'wN270', namedCell('n', 'G', ['Royal'])]) {
    const board = setBoardCell(createEmptyBoard(), 3, 2, piece);
    const { selection } = resolveBoardClick(board, null, 3, 2);
    assert.deepEqual(resolveBoardClick(board, selection, 5, 7), {
      selection: null,
      drop: { piece, from: [3, 2] }
    });
  }
});

test('an invalid target does not discard an active selection', () => {
  const board = parseFEN(STARTING_FEN);
  const selection: PieceSelection = { source: 'board', square: [6, 4] };
  for (const row of [-1, 8, NaN, 0.5]) {
    const result = resolveBoardClick(board, selection, row, 4);
    assert.equal(result.selection, selection);
    assert.equal(result.drop, undefined);
  }
});

test('a removed source cannot create a ghost copy on the next click', () => {
  const board = createEmptyBoard();
  assert.deepEqual(
    resolveBoardClick(board, { source: 'board', square: [6, 4] }, 4, 4),
    { selection: null }
  );
});
