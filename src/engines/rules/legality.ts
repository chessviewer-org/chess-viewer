import { inCheck, kingSquare, type Position } from './moves';

const START_RANKS = [
  'rnbqkbnr',
  'pppppppp',
  '',
  '',
  '',
  '',
  'PPPPPPPP',
  'RNBQKBNR'
];

const countOf = (cells: string[], piece: string) =>
  cells.filter((cell) => cell === piece).length;

function sideProblem(cells: string[], white: boolean): string | null {
  const own = (piece: string) => (white ? piece.toUpperCase() : piece);
  if (countOf(cells, own('k')) !== 1)
    return 'Each side needs exactly one king.';
  const pawns = countOf(cells, own('p'));
  if (pawns > 8) return 'A side cannot have more than eight pawns.';
  const promoted =
    Math.max(0, countOf(cells, own('q')) - 1) +
    Math.max(0, countOf(cells, own('r')) - 2) +
    Math.max(0, countOf(cells, own('b')) - 2) +
    Math.max(0, countOf(cells, own('n')) - 2);
  return promoted > 8 - pawns
    ? 'There are more pieces than the pawns could have promoted into.'
    : null;
}

export function positionProblem(
  position: Position,
  hypothetical = false
): string | null {
  const { board, turn } = position;
  const cells = board.flat();
  const problem = sideProblem(cells, true) ?? sideProblem(cells, false);
  if (problem) return problem;
  if ([...board[0]!, ...board[7]!].some((cell) => /^[Pp]$/.test(cell)))
    return 'Pawns cannot stand on the first or last rank.';
  const white = kingSquare(board, 'w')!;
  const black = kingSquare(board, 'b')!;
  if (Math.abs(white[0] - black[0]) < 2 && Math.abs(white[1] - black[1]) < 2)
    return 'The kings cannot stand next to each other.';
  if (inCheck(position, turn === 'w' ? 'b' : 'w'))
    return `${turn === 'w' ? 'Black' : 'White'} is in check but it is not their move.`;
  if (
    !hypothetical &&
    turn === 'b' &&
    START_RANKS.every(
      (rank, row) =>
        (rank || '        ') === board[row]!.map((cell) => cell || ' ').join('')
    )
  )
    return 'This is the starting position, so White must be to move.';
  return null;
}
