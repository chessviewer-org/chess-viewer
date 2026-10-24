import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestedPieceKeys } from '../src/shared/utils/pieceRequest';
import { parseFEN } from '../src/shared/utils/fenParser';

test('standard and fairy load only currently visible palette artwork', () => {
  assert.equal(requestedPieceKeys({}).length, 12);
  const fairy = requestedPieceKeys({ palette: 'fairy' });
  assert.equal(fairy.length, 18);
  assert.ok(fairy.includes('nQ'));
  assert.ok(!fairy.some((key) => /90|180|270/.test(key)));
  const turned = requestedPieceKeys({ palette: 'fairy', rotation: 90 });
  assert.equal(turned.length, 30);
  assert.ok(turned.includes('nQ90'));
  assert.ok(turned.includes('wK'));
  assert.ok(!turned.some((key) => /180|270/.test(key)));
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

test('actual board stays authoritative while input is incomplete', () => {
  const board = parseFEN('-*3Q7/8/8/8/8/8/8/8 w - - 0 1');
  const keys = requestedPieceKeys({ board, positions: '-*' });
  assert.equal(keys.length, 13);
  assert.ok(keys.includes('nQ270'));
  assert.equal(requestedPieceKeys({ positions: '-*' }).length, 12);
});

test('catalogue selection loads all three colours without loading the catalogue', () => {
  const board = Array.from({ length: 8 }, () => Array<string>(8).fill(''));
  board[0]![0] = 'n@WR';
  const keys = requestedPieceKeys({ board, selectedPiece: 'w@WR' });
  assert.equal(keys.length, 15);
  for (const color of ['w', 'b', 'n']) assert.ok(keys.includes(`${color}@WR`));
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
