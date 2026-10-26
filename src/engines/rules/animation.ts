import type { BoardAnimation, PieceMotion } from '../animation';
import type { Move, Position } from './moves';

const index = ([row, col]: readonly [number, number]) => row * 8 + col;

/** Use the accepted move itself so special moves never need board-diff guesses. */
export function orthodoxMoveAnimation(
  position: Position,
  move: Move
): BoardAnimation {
  const [fromRow] = move.from;
  const [, toCol] = move.to;
  const capturedSquare: [number, number] =
    move.kind === 'enPassant' ? [fromRow, toCol] : move.to;
  const captured = position.board[capturedSquare[0]]![capturedSquare[1]]!;
  const motions: PieceMotion[] = [];

  if (captured)
    motions.push({
      id: 1,
      piece: captured,
      path: [index(capturedSquare)],
      removed: true
    });

  motions.push({
    id: 2,
    piece: move.piece,
    path: [index(move.from), index(move.to)],
    removed: false
  });

  if (move.kind === 'castleShort' || move.kind === 'castleLong') {
    const rookFrom = move.kind === 'castleShort' ? 7 : 0;
    const rookTo = move.kind === 'castleShort' ? 5 : 3;
    motions.push({
      id: 3,
      piece: position.board[fromRow]![rookFrom]!,
      path: [index([fromRow, rookFrom]), index([fromRow, rookTo])],
      removed: false
    });
  }

  return { before: position.board, motions };
}
