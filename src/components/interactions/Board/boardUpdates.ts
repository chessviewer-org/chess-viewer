import type { BoardCell, ChessBoard } from '@app-types';
import type { PositionContext } from '@/shared/utils/fenParser';

function hasSquare(board: ChessBoard, row: number, col: number): boolean {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < 8 &&
    col >= 0 &&
    col < 8 &&
    board[row]?.[col] !== undefined
  );
}

/** Preserve every unaffected rank so board rendering can skip it. */
export function setBoardCell(
  board: ChessBoard,
  row: number,
  col: number,
  piece: BoardCell
): ChessBoard {
  if (!hasSquare(board, row, col) || board[row]![col] === piece) return board;
  const next = board.slice();
  const rank = board[row]!.slice();
  rank[col] = piece;
  next[row] = rank;
  return next;
}

export function moveBoardCell(
  board: ChessBoard,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): ChessBoard {
  if (
    !hasSquare(board, fromRow, fromCol) ||
    !hasSquare(board, toRow, toCol) ||
    (fromRow === toRow && fromCol === toCol)
  )
    return board;
  const piece = board[fromRow]![fromCol];
  if (!piece) return board;
  const next = board.slice();
  const fromRank = board[fromRow]!.slice();
  const toRank = fromRow === toRow ? fromRank : board[toRow]!.slice();
  fromRank[fromCol] = '';
  toRank[toCol] = piece;
  next[fromRow] = fromRank;
  next[toRow] = toRank;
  return next;
}

export function boardsEqual(a: ChessBoard, b: ChessBoard): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let row = 0; row < a.length; row++) {
    const aRank = a[row]!;
    const bRank = b[row]!;
    if (aRank === bRank) continue;
    if (aRank.length !== bRank.length) return false;
    for (let col = 0; col < aRank.length; col++)
      if (aRank[col] !== bRank[col]) return false;
  }
  return true;
}

export function positionContextsEqual(
  a: PositionContext,
  b: PositionContext
): boolean {
  if (a === b) return true;
  if (a.fenMetadata !== b.fenMetadata) return false;
  if (a.commands === b.commands) return true;
  if (!a.commands || !b.commands || a.commands.length !== b.commands.length)
    return false;
  return a.commands.every((command, index) => {
    const other = b.commands![index]!;
    return command.keyword === other.keyword && command.value === other.value;
  });
}
