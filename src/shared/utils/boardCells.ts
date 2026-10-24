import {
  describeBoardPosition as describeStandardBoard,
  indicesToSquare,
  pieceToName as fenPieceToName
} from '@chessviewer-org/chess-viewer';

import type { BoardCell, ChessBoard, PieceSymbol } from '@app-types';

import { parseNamedCell } from './fairyCells';

export type { BoardCell } from '@app-types';

const CELL_CODE = /^([wbn])([KQRBNP])(90|180|270)?$/;

export interface CellCode {
  color: 'w' | 'b' | 'n';
  type: 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
  rotation: 0 | 90 | 180 | 270;
}

const COLOR_WORDS: Record<CellCode['color'], string> = {
  w: 'white',
  b: 'black',
  n: 'neutral'
};

const TYPE_WORDS: Record<CellCode['type'], string> = {
  K: 'king',
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
  P: 'pawn'
};

export function parseCellCode(cell: BoardCell): CellCode | null {
  const named = parseNamedCell(cell);
  if (named) {
    const glyph = named.definition.glyph ?? 'P';
    return {
      color: named.color,
      type: glyph[0] as CellCode['type'],
      rotation: Number(glyph.slice(1) || 0) as CellCode['rotation']
    };
  }
  const match = CELL_CODE.exec(cell);
  if (!match) return null;
  return {
    color: match[1] as CellCode['color'],
    type: match[2] as CellCode['type'],
    rotation: (match[3] ? Number(match[3]) : 0) as CellCode['rotation']
  };
}

export function isFairyCell(cell: BoardCell): boolean {
  if (parseNamedCell(cell)) return true;
  const code = parseCellCode(cell);
  return !!code && (code.color === 'n' || code.rotation !== 0);
}

export function cellToFenPiece(cell: BoardCell): PieceSymbol {
  const code = parseCellCode(cell);
  if (!code) return cell as PieceSymbol;
  return code.color === 'b'
    ? (code.type.toLowerCase() as PieceSymbol)
    : code.type;
}

export function baseCells(board: ChessBoard): PieceSymbol[][] {
  return board.map((row) => row.map((cell) => cellToFenPiece(cell)));
}

export function boardToFEN(board: ChessBoard): string {
  if (board.some((rank) => rank.some((cell) => parseNamedCell(cell))))
    throw new Error('Named fairy pieces require Popeye notation.');
  return board
    .map((rank) => {
      let empty = 0;
      let placement = '';
      for (const cell of rank) {
        if (!cell) {
          empty++;
          continue;
        }
        if (empty) {
          placement += empty;
          empty = 0;
        }
        const code = parseCellCode(cell);
        if (!code) {
          placement += cell;
          continue;
        }
        const neutral = code.color === 'n' ? '-' : '';
        const rotation = code.rotation ? `*${code.rotation / 90}` : '';
        const symbol = code.color === 'b' ? code.type.toLowerCase() : code.type;
        placement += `${neutral}${rotation}${symbol}`;
      }
      return placement + (empty || '');
    })
    .join('/');
}

export function cellName(cell: BoardCell): string {
  const named = parseNamedCell(cell);
  if (named)
    return [
      COLOR_WORDS[named.color],
      ...named.attributes,
      named.definition.name
    ].join(' ');
  const code = parseCellCode(cell);
  if (!code) return cell ? fenPieceToName(cell) : '';
  const rotation = code.rotation ? ` (${code.rotation}°)` : '';
  return `${COLOR_WORDS[code.color]} ${TYPE_WORDS[code.type]}${rotation}`;
}

export function describeBoardPosition(
  board: ChessBoard,
  flipped = false
): string {
  if (!board.some((rank) => rank.some(isFairyCell)))
    return describeStandardBoard(baseCells(board), flipped);
  const descriptions: string[] = [];
  for (let displayRow = 0; displayRow < 8; displayRow++)
    for (let displayCol = 0; displayCol < 8; displayCol++) {
      const row = flipped ? 7 - displayRow : displayRow;
      const col = flipped ? 7 - displayCol : displayCol;
      const cell = board[row]?.[col];
      if (cell)
        descriptions.push(`${cellName(cell)} ${indicesToSquare(row, col)}`);
    }
  return descriptions.join(', ');
}

export function positionPieceCounts(fenBoard: ChessBoard): {
  white: number;
  black: number;
  neutral: number;
} {
  const counts = { white: 0, black: 0, neutral: 0 };
  for (const cell of fenBoard.flat()) {
    if (!cell) continue;
    const code = parseCellCode(cell);
    const color = code?.color ?? (cell === cell.toUpperCase() ? 'w' : 'b');
    counts[color === 'w' ? 'white' : color === 'b' ? 'black' : 'neutral']++;
  }
  return counts;
}
