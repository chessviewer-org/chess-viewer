import type { BoardCell, ChessBoard } from '@app-types';

type Square = readonly [row: number, col: number];

export type PieceSelection =
  | { source: 'board'; square: Square }
  | { source: 'palette'; piece: BoardCell }
  | null;

interface BoardClick {
  selection: PieceSelection;
  drop?: { piece: BoardCell; from: Square | null };
}

/** Palette placement and board movement are mutually exclusive modes. */
export function resolveBoardClick(
  board: ChessBoard,
  selection: PieceSelection,
  row: number,
  col: number
): BoardClick {
  const target = board[row]?.[col];
  if (target === undefined) return { selection };

  if (selection?.source === 'palette') {
    return target === selection.piece
      ? { selection }
      : { selection, drop: { piece: selection.piece, from: null } };
  }

  if (selection?.source === 'board') {
    const [fromRow, fromCol] = selection.square;
    if (fromRow === row && fromCol === col) return { selection: null };
    const piece = board[fromRow]?.[fromCol];
    if (piece)
      return {
        selection: null,
        drop: { piece, from: selection.square }
      };
  }

  return {
    selection: target ? { source: 'board', square: [row, col] } : null
  };
}
