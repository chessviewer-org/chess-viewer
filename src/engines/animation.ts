import type { BoardCell, ChessBoard } from '@app-types';

export interface PieceMotion {
  id: number;
  piece: BoardCell;
  path: number[];
  removed: boolean;
}

export interface BoardAnimation {
  before: ChessBoard;
  motions: PieceMotion[];
}

/** Animate an editor placement directly from the user's selected squares. */
export function directMoveAnimation(
  before: ChessBoard,
  from: readonly [number, number],
  to: readonly [number, number]
): BoardAnimation | null {
  const piece = before[from[0]]?.[from[1]];
  if (!piece || (from[0] === to[0] && from[1] === to[1])) return null;
  const target = before[to[0]]?.[to[1]];
  const destination = to[0] * 8 + to[1];
  return {
    before,
    motions: [
      ...(target
        ? [{ id: 1, piece: target, path: [destination], removed: true }]
        : []),
      {
        id: 2,
        piece,
        path: [from[0] * 8 + from[1], destination],
        removed: false
      }
    ]
  };
}
