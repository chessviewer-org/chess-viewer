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

test('a walk without a Popeye glyph keeps its own turned piece as others join', () => {
  const board = Array.from({ length: 8 }, () => Array<string>(8).fill(''));
  board[0]![0] = 'w@B1';
  const alone = requestedPieceMap({ board })['w@B1'];
  board[0]![1] = 'b@B1';
  board[0]![2] = 'n@SK';
  board[0]![3] = 'w@B2';
  board[0]![4] = 'w@G';
  const map = requestedPieceMap({ board });
  assert.equal(map['w@B1'], alone);
  assert.equal(map['b@B1'], `b${alone?.slice(1)}`);
  const shapes = ['w@B1', 'n@SK', 'w@B2'].map((key) => map[key]?.slice(1));
  assert.equal(new Set(shapes).size, 3);
  assert.ok(!shapes.includes('Q180'));
});

test('a turned piece already on the board moves the walk to its next shape', () => {
  const board = Array.from({ length: 8 }, () => Array<string>(8).fill(''));
  board[0]![0] = 'w@B1';
  const own = requestedPieceMap({ board })['w@B1']!.slice(1);
  board[0]![1] = `b${own}`;
  const moved = requestedPieceMap({ board })['w@B1']!.slice(1);
  assert.notEqual(moved, own);
});
