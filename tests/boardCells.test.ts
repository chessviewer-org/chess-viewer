import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  baseCells,
  boardToFEN,
  cellName,
  cellToFenPiece,
  isFairyCell,
  parseCellCode,
  positionPieceCounts
} from '@utils/boardCells';
import { getPieceKey, piecePath } from '@utils/pieceUtils';
import {
  FAIRY_COLORS,
  FAIRY_PIECE_TYPES,
  FAIRY_ROTATIONS,
  fairyCode
} from '@constants';
import type { ChessBoard, PieceSymbol } from '@app-types';

const EMPTY: PieceSymbol[][] = Array.from({ length: 8 }, () =>
  Array<PieceSymbol>(8).fill('')
);

function boardWith(entries: Record<string, string>): ChessBoard {
  const board = EMPTY.map((row) => [...row]) as ChessBoard;
  for (const [square, cell] of Object.entries(entries)) {
    const col = square.charCodeAt(0) - 97;
    const row = 8 - Number(square[1]);
    const target = board[row];
    if (target) target[col] = cell;
  }
  return board;
}

describe('parseCellCode', () => {
  test('recognises base, rotated and neutral codes', () => {
    assert.deepEqual(parseCellCode('wK'), {
      color: 'w',
      type: 'K',
      rotation: 0
    });
    assert.deepEqual(parseCellCode('bP270'), {
      color: 'b',
      type: 'P',
      rotation: 270
    });
    assert.deepEqual(parseCellCode('nQ90'), {
      color: 'n',
      type: 'Q',
      rotation: 90
    });
  });

  test('rejects FEN letters, empty cells and malformed codes', () => {
    for (const cell of ['K', 'p', '', 'wZ', 'wK45', 'xK90', 'K90']) {
      assert.equal(parseCellCode(cell), null, `${cell} should not parse`);
    }
  });
});

describe('isFairyCell', () => {
  test('treats neutral and rotated cells as fairy', () => {
    assert.equal(isFairyCell('nK'), true);
    assert.equal(isFairyCell('wK90'), true);
    assert.equal(isFairyCell('bR180'), true);
  });

  test('keeps standard pieces and empty cells out of the fairy set', () => {
    for (const cell of ['wK', 'bP', 'K', 'k', '']) {
      assert.equal(isFairyCell(cell), false, `${cell} should not be fairy`);
    }
  });

  test('recognises unrotated FFEN diagram symbols without treating them as men', () => {
    for (const code of ['wC', 'bX', 'nS', 'wT270']) {
      assert.equal(isFairyCell(code), true);
      assert.equal(cellToFenPiece(code), '');
      assert.equal(getPieceKey(code), code);
    }
    const board = boardWith({
      a8: 'wC',
      b8: 'bX',
      c8: 'nS',
      d8: 'wT270',
      e8: 'K',
      f8: 'p'
    });
    assert.deepEqual(positionPieceCounts(board), {
      white: 1,
      black: 1,
      neutral: 0
    });
    assert.equal(boardToFEN(baseCells(board)), '4Kp2/8/8/8/8/8/8/8');
    assert.equal(cellName('nT90'), 'neutral triangle (90°)');
  });
});

describe('cellToFenPiece', () => {
  test('maps fairy colours to FEN letters and keeps the piece type', () => {
    assert.equal(cellToFenPiece('wK'), 'K');
    assert.equal(cellToFenPiece('bN90'), 'n');
    assert.equal(cellToFenPiece('nR180'), 'R');
    assert.equal(cellToFenPiece('wP270'), 'P');
  });

  test('passes FEN letters and empty cells through unchanged', () => {
    assert.equal(cellToFenPiece('Q'), 'Q');
    assert.equal(cellToFenPiece('p'), 'p');
    assert.equal(cellToFenPiece(''), '');
  });
});

describe('baseCells', () => {
  test('strips fairy decoration from every cell', () => {
    const cells = baseCells(boardWith({ a8: 'nK', h1: 'wB90', e4: 'p' }));
    assert.equal(cells[0]?.[0], 'K');
    assert.equal(cells[7]?.[7], 'B');
    assert.equal(cells[4]?.[4], 'p');
  });
});

describe('boardToFEN', () => {
  test('serialises decorated boards as Fairy FEN placements', () => {
    const board = boardWith({ a8: 'nQ', h1: 'wR270' });
    assert.equal(boardToFEN(board), '-Q7/8/8/8/8/8/8/7*3R');
  });

  test('an empty decorated board is the standard empty placement', () => {
    const empty = Array.from({ length: 8 }, () => Array<string>(8).fill(''));
    assert.equal(boardToFEN(empty as ChessBoard), '8/8/8/8/8/8/8/8');
  });
});

describe('cellName', () => {
  test('names colour, piece and rotation for fairy cells', () => {
    assert.equal(cellName('wK'), 'white king');
    assert.equal(cellName('nQ90'), 'neutral queen (90°)');
    assert.equal(cellName('bP270'), 'black pawn (270°)');
  });

  test('names standard FEN cells through the library helper', () => {
    assert.equal(cellName('K'), 'white king');
    assert.equal(cellName('p'), 'black pawn');
    assert.equal(cellName(''), '');
  });
});

describe('getPieceKey', () => {
  test('returns fairy codes untouched as image keys', () => {
    assert.equal(getPieceKey('nQ'), 'nQ');
    assert.equal(getPieceKey('wK180'), 'wK180');
    assert.equal(getPieceKey('wK'), 'wK');
    assert.equal(getPieceKey('bP'), 'bP');
  });

  test('builds standard image keys from FEN letters', () => {
    assert.equal(getPieceKey('K'), 'wK');
    assert.equal(getPieceKey('q'), 'bQ');
    assert.equal(getPieceKey(''), null);
  });
});

describe('piecePath', () => {
  test('routes fairy keys to the fairypiece directory', () => {
    assert.equal(piecePath('cburnett', 'nQ'), '/fairypiece/cburnett/nQ.svg');
    assert.equal(
      piecePath('cburnett', 'wK90'),
      '/fairypiece/cburnett/wK90.svg'
    );
  });

  test('keeps the twelve base pieces in their own set directory', () => {
    for (const key of ['wK', 'wP', 'bQ', 'bN', 'K', 'k']) {
      assert.equal(
        piecePath('cburnett', key),
        `/piece/cburnett/${key}.svg`,
        `${key} should stay in the set directory`
      );
    }
  });
});

describe('fairy piece glyphs', () => {
  test('rotated and neutral pieces use generated files, markers draw inline', () => {
    const glyphs = FAIRY_COLORS.flatMap((color) =>
      FAIRY_PIECE_TYPES.flatMap((type) =>
        FAIRY_ROTATIONS.map((rotation) => fairyCode(color, type, rotation))
      )
    ).filter((key) => !/^[wb][KQRBNP]$/.test(key));
    assert.equal(glyphs.length, 108);
    for (const key of glyphs) {
      if (/^[wbn][CXST]/.test(key)) {
        assert.match(piecePath('cburnett', key), /^data:image\/svg\+xml/);
        assert.equal(piecePath('cburnett', key), piecePath('merida', key));
      } else
        assert.equal(
          piecePath('cburnett', key),
          `/fairypiece/cburnett/${key}.svg`
        );
    }
  });
});
