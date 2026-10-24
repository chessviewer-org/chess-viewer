import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestedPieceMap } from '../src/shared/utils/pieceRequest';
import { parseFEN } from '../src/shared/utils/fenParser';

const requestedPieceKeys = (request: Parameters<typeof requestedPieceMap>[0]) =>
  Object.keys(requestedPieceMap(request));

test('an empty request loads only the standard palette artwork', () => {
  const keys = requestedPieceKeys({});
  assert.equal(keys.length, 12);
  assert.ok(!keys.some((key) => /^n|90|180|270/.test(key)));
});

test('imported positions retain each used rotation and neutral symbol', () => {
  const positions = [
    '-B7/1*1B6/2-*2r5/3*3q4/8/8/8/8 b - - 12 34',
    '-B7/8/8/8/8/8/8/8 w - - 0 1'
  ];
  const keys = requestedPieceKeys({ positions });
  assert.equal(keys.length, 16);
  for (const key of ['nB', 'wB90', 'nR180', 'bQ270'])
    assert.ok(keys.includes(key), key);
});

test('diagram markers load only their used artwork outside the visible palette', () => {
  const keys = requestedPieceKeys({
    positions: 'C7/1x6/2-*2S5/3*3t4/8/8/8/8 w - - 0 1'
  });
  assert.equal(keys.length, 16);
  for (const key of ['wC', 'bX', 'nS', 'bT270'])
    assert.ok(keys.includes(key), key);
  assert.ok(!keys.includes('wC90'));
});

test('actual board stays authoritative while input is incomplete', () => {
  const board = parseFEN('-*3Q7/8/8/8/8/8/8/8 w - - 0 1');
  const keys = requestedPieceKeys({ board, positions: '-*' });
  assert.equal(keys.length, 13);
  assert.ok(keys.includes('nQ270'));
  assert.equal(requestedPieceKeys({ positions: '-*' }).length, 12);
});

test('the held piece loads without loading the rest of the catalogue', () => {
  const board = Array.from({ length: 8 }, () => Array<string>(8).fill(''));
  board[0]![0] = 'n@WR';
  const keys = requestedPieceKeys({ board, selectedPiece: 'w@WR' });
  assert.equal(keys.length, 14);
  for (const key of ['w@WR', 'n@WR']) assert.ok(keys.includes(key), key);
  assert.ok(!keys.includes('b@WR'));
});

test('artwork identity ignores cell attributes and is independent of square order', () => {
  const board = Array.from({ length: 8 }, () => Array<string>(8).fill(''));
  board[0]![0] = 'w@WR~Royal';
  board[0]![1] = 'w@WR';
  const before = requestedPieceKeys({ board });
  board[0]!.reverse();
  assert.deepEqual(requestedPieceKeys({ board }), before);
  assert.equal(before.length, 13);
  assert.ok(before.includes('w@WR'));
});

test('a walk without a Popeye glyph borrows a turned piece no other walk uses', () => {
  const board = Array.from({ length: 8 }, () => Array<string>(8).fill(''));
  board[0]![0] = 'w@B1';
  board[0]![1] = 'b@B1';
  board[0]![2] = 'w@G';
  board[0]![3] = 'n@SK';
  const map = requestedPieceMap({ board });
  assert.equal(map['w@B1'], 'wR180');
  assert.equal(map['b@B1'], 'bR180');
  assert.equal(map['n@SK'], 'nB180');
  assert.equal(map['wQ180'], '');
});
