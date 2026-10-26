import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  MAX_FEN_LENGTH,
  createEmptyBoard,
  getDisplayCoordinates,
  isLightSquare,
  parseFEN,
  sanitizeInput,
  validateFEN
} from '@chessviewer-org/chess-viewer';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

describe('MAX_FEN_LENGTH', () => {
  test('is exactly 93', () => {
    assert.equal(MAX_FEN_LENGTH, 93);
  });

  test('STARTING_FEN fits within max length', () => {
    assert.ok(STARTING_FEN.length <= MAX_FEN_LENGTH);
  });
});

describe('parseFEN → BoardMatrix (8×8)', () => {
  test('returns 8 rows', () => {
    const board = parseFEN(STARTING_FEN);
    assert.equal(board.length, 8);
  });

  test('each row has 8 columns', () => {
    const board = parseFEN(STARTING_FEN);
    for (let r = 0; r < 8; r++) {
      assert.equal(board[r]!.length, 8);
    }
  });

  test('starting position: row 0 = black pieces (r n b q k b n r)', () => {
    const board = parseFEN(STARTING_FEN);
    assert.deepEqual(board[0], ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']);
  });

  test('starting position: row 1 = black pawns', () => {
    const board = parseFEN(STARTING_FEN);
    assert.deepEqual(board[1], ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p']);
  });

  test('starting position: rows 2-5 are empty', () => {
    const board = parseFEN(STARTING_FEN);
    for (let r = 2; r <= 5; r++) {
      assert.deepEqual(board[r], ['', '', '', '', '', '', '', '']);
    }
  });

  test('starting position: row 6 = white pawns', () => {
    const board = parseFEN(STARTING_FEN);
    assert.deepEqual(board[6], ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P']);
  });

  test('starting position: row 7 = white pieces', () => {
    const board = parseFEN(STARTING_FEN);
    assert.deepEqual(board[7], ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']);
  });

  test('empty board: all cells are empty strings', () => {
    const board = parseFEN(EMPTY_FEN);
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        assert.equal(board[r]![c], '');
      }
    }
  });

  test('single piece: white king on e4', () => {
    const board = parseFEN('8/8/8/4K3/8/8/8/8 w - - 0 1');
    assert.equal(board[3]![4], 'K');
    assert.equal(board[3]![3], '');
  });

  test('mixed pieces with numbers expand correctly', () => {
    const board = parseFEN('r7/8/8/8/8/8/8/7R w - - 0 1');
    assert.equal(board[0]![0], 'r');
    for (let c = 1; c < 7; c++) assert.equal(board[0]![c], '');
    assert.equal(board[7]![7], 'R');
  });

  test('all 6 piece types for white and black in starting position', () => {
    const board = parseFEN(STARTING_FEN);
    const blackRow = board[0]!;
    assert.equal(blackRow[0], 'r');
    assert.equal(blackRow[1], 'n');
    assert.equal(blackRow[2], 'b');
    assert.equal(blackRow[3], 'q');
    assert.equal(blackRow[4], 'k');
    assert.equal(blackRow[5], 'b');
    assert.equal(blackRow[6], 'n');
    assert.equal(blackRow[7], 'r');
    const whiteRow = board[7]!;
    assert.equal(whiteRow[0], 'R');
    assert.equal(whiteRow[1], 'N');
    assert.equal(whiteRow[2], 'B');
    assert.equal(whiteRow[3], 'Q');
    assert.equal(whiteRow[4], 'K');
    assert.equal(whiteRow[5], 'B');
    assert.equal(whiteRow[6], 'N');
    assert.equal(whiteRow[7], 'R');
  });
});

describe('validateFEN', () => {
  test('valid starting FEN returns true', () => {
    assert.equal(validateFEN(STARTING_FEN), true);
  });

  test('empty FEN returns false', () => {
    assert.equal(validateFEN(''), false);
  });

  test('FEN with wrong row count returns false', () => {
    assert.equal(
      validateFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1'),
      false
    );
  });

  test('FEN with invalid characters returns false', () => {
    assert.equal(validateFEN('XXXX/8/8/8/8/8/8/8 w - - 0 1'), false);
  });
});

describe('isLightSquare', () => {
  test('(0,0) = a8 = light (true)', () => {
    assert.equal(isLightSquare(0, 0), true);
  });

  test('(0,1) = b8 = dark (false)', () => {
    assert.equal(isLightSquare(0, 1), false);
  });

  test('(7,0) = a1 = dark (false)', () => {
    assert.equal(isLightSquare(7, 0), false);
  });

  test('(7,7) = h1 = light (true)', () => {
    assert.equal(isLightSquare(7, 7), true);
  });

  test('adjacent squares alternate color', () => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 7; c++) {
        assert.notEqual(isLightSquare(r, c), isLightSquare(r, c + 1));
      }
    }
  });

  test('32 light and 32 dark squares on an 8×8 board', () => {
    let light = 0;
    let dark = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isLightSquare(r, c)) light++;
        else dark++;
      }
    }
    assert.equal(light, 32);
    assert.equal(dark, 32);
  });
});

describe('getDisplayCoordinates', () => {
  test('not flipped: (0,0) → (0,0)', () => {
    const [r, c] = getDisplayCoordinates(0, 0, false);
    assert.equal(r, 0);
    assert.equal(c, 0);
  });

  test('not flipped: (7,7) → (7,7)', () => {
    const [r, c] = getDisplayCoordinates(7, 7, false);
    assert.equal(r, 7);
    assert.equal(c, 7);
  });

  test('flipped: (0,0) → (7,7)', () => {
    const [r, c] = getDisplayCoordinates(0, 0, true);
    assert.equal(r, 7);
    assert.equal(c, 7);
  });

  test('flipped: (7,7) → (0,0)', () => {
    const [r, c] = getDisplayCoordinates(7, 7, true);
    assert.equal(r, 0);
    assert.equal(c, 0);
  });

  test('flipped: (0,7) → (7,0) — corner swap', () => {
    const [r, c] = getDisplayCoordinates(0, 7, true);
    assert.equal(r, 7);
    assert.equal(c, 0);
  });

  test('flipped: (7,0) → (0,7) — corner swap', () => {
    const [r, c] = getDisplayCoordinates(7, 0, true);
    assert.equal(r, 0);
    assert.equal(c, 7);
  });

  test('flip is its own inverse for all squares', () => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const [r1, c1] = getDisplayCoordinates(r, c, true);
        const [r2, c2] = getDisplayCoordinates(r1, c1, true);
        assert.equal(r2, r);
        assert.equal(c2, c);
      }
    }
  });

  test('not flipped preserves all coordinates', () => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const [dr, dc] = getDisplayCoordinates(r, c, false);
        assert.equal(dr, r);
        assert.equal(dc, c);
      }
    }
  });
});

describe('sanitizeInput', () => {
  test('passes through safe strings', () => {
    assert.equal(sanitizeInput('#f0d9b5'), '#f0d9b5');
    assert.equal(sanitizeInput('rgb(240,217,181)'), 'rgb(240,217,181)');
  });

  test('escapes script tags', () => {
    const cleaned = sanitizeInput('<script>alert(1)</script>');
    assert.ok(!cleaned.includes('<script>'));
    assert.ok(cleaned.includes('&lt;script&gt;'));
  });

  test('escapes quotes in attributes', () => {
    const cleaned = sanitizeInput('onerror="alert(1)"');
    assert.ok(cleaned.includes('&quot;'));
  });

  test('handles empty string', () => {
    assert.equal(sanitizeInput(''), '');
  });
});

describe('createEmptyBoard', () => {
  test('returns 8×8 of empty strings', () => {
    const board = createEmptyBoard();
    assert.equal(board.length, 8);
    for (let r = 0; r < 8; r++) {
      assert.equal(board[r]!.length, 8);
      for (let c = 0; c < 8; c++) {
        assert.equal(board[r]![c], '');
      }
    }
  });
});
