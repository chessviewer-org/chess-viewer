import type { ChessBoard } from '@app-types';

export type Square = readonly [number, number];

export interface BoardArrow {
  from: Square;
  to: Square;
  rank: number;
  tone: 'hint' | 'threat';
}

export function moveArrow(
  before: ChessBoard,
  after: ChessBoard
): Pick<BoardArrow, 'from' | 'to'> | null {
  const left: Square[] = [];
  const arrived: Square[] = [];
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 8; col++) {
      if (before[row]![col] === after[row]![col]) continue;
      (after[row]![col] ? arrived : left).push([row, col]);
    }
  const to =
    arrived.length > 1
      ? arrived.find(([row, col]) => /^[Kk]$/.test(after[row]![col]!))
      : arrived[0];
  if (!to) return null;
  const moved = after[to[0]]![to[1]];
  const from =
    left.find(([row, col]) => before[row]![col] === moved) ??
    (left.length === 1 ? left[0] : undefined);
  return from ? { from, to } : null;
}

export function lineArrows(
  before: ChessBoard,
  firstMoves: ReadonlyArray<ChessBoard | undefined>,
  tone: BoardArrow['tone'] = 'hint'
): BoardArrow[] {
  const arrows: BoardArrow[] = [];
  firstMoves.forEach((after, rank) => {
    const arrow = after && moveArrow(before, after);
    if (
      arrow &&
      !arrows.some(
        (known) =>
          known.from.join() === arrow.from.join() &&
          known.to.join() === arrow.to.join()
      )
    )
      arrows.push({ ...arrow, rank, tone });
  });
  return arrows;
}
