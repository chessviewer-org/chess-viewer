import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseSmartNaming } from './parseSmartNaming';

describe('parseSmartNaming', () => {
  it('returns an array of empty strings for empty input', () => {
    // Invariant: empty input never invents names — the export layer applies the
    // `Position-N` fallback via `raw || ...`, so the parser must stay neutral.
    assert.deepEqual(parseSmartNaming('', 3), ['', '', '']);
  });

  it('treats whitespace-only input as empty', () => {
    assert.deepEqual(parseSmartNaming('   ', 2), ['', '']);
  });

  it('returns an empty array when totalCount is 0', () => {
    assert.deepEqual(parseSmartNaming('Foo', 0), []);
  });

  it('expands a bare base name to base-N for every position', () => {
    assert.deepEqual(parseSmartNaming('Game', 3), [
      'Game-1',
      'Game-2',
      'Game-3'
    ]);
  });

  it('maps an explicit range to sequential base-N names', () => {
    assert.deepEqual(parseSmartNaming('Position[1-6]', 6), [
      'Position-1',
      'Position-2',
      'Position-3',
      'Position-4',
      'Position-5',
      'Position-6'
    ]);
  });

  it('fills positions outside a partial range with Position-N fallback', () => {
    // Position[1-6] against only 3 FENs: in-range slots get the custom name,
    // the parser clamps the range to totalCount so no out-of-bounds writes occur.
    assert.deepEqual(parseSmartNaming('Position[1-6]', 3), [
      'Position-1',
      'Position-2',
      'Position-3'
    ]);
  });

  it('clamps a range that starts in-bounds and runs past the end', () => {
    assert.deepEqual(parseSmartNaming('Game[1-9]', 2), ['Game-1', 'Game-2']);
  });

  it('drops a range that is entirely out of bounds, falling back to Position-N', () => {
    // When the range is entirely out of bounds, unassigned slots fall back to
    // the range's own base name (not the generic "Position-N").
    assert.deepEqual(parseSmartNaming('Game[5-8]', 3), [
      'Game-1',
      'Game-2',
      'Game-3'
    ]);
  });

  it('normalizes a reversed range (end < start)', () => {
    assert.deepEqual(parseSmartNaming('X[3-1]', 3), ['X-1', 'X-2', 'X-3']);
  });

  it('applies multiple comma-separated ranges with per-token counters', () => {
    assert.deepEqual(parseSmartNaming('A[1-2],B[3-4]', 4), [
      'A-1',
      'A-2',
      'B-1',
      'B-2'
    ]);
  });

  it('lets a later overlapping range overwrite an earlier slot', () => {
    // A[1-3] fills slots 0-2, then B[2-2] overwrites slot 1 with its own
    // counter (B-1). Last writer wins; counters are per-token, not global.
    assert.deepEqual(parseSmartNaming('A[1-3],B[2-2]', 3), [
      'A-1',
      'B-1',
      'A-3'
    ]);
  });

  it('does not throw and pads to totalCount for any input length', () => {
    const out = parseSmartNaming('Only[1-1]', 5);
    assert.equal(out.length, 5);
    assert.equal(out[0], 'Only-1');
    // Unassigned slots fall back to the last seen range base name, not "Position".
    assert.deepEqual(out.slice(1), ['Only-2', 'Only-3', 'Only-4', 'Only-5']);
  });
});
