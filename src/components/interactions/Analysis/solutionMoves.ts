import type { PreviewMove, SolutionLine } from '@/engines/core/types';

export interface MoveLocation {
  solutionId: number;
  variationId?: number;
  moveIndex: number;
}

export function moveAt(
  solutions: readonly SolutionLine[],
  location: MoveLocation
): PreviewMove | undefined {
  const solution = solutions.find((line) => line.id === location.solutionId);
  const moves =
    location.variationId === undefined
      ? solution?.moves
      : solution?.variations.find((line) => line.id === location.variationId)
          ?.moves;
  return moves?.[location.moveIndex];
}

export function moveTokens(text: string, moves: readonly PreviewMove[]) {
  const parts: Array<{
    key: string;
    text: string;
    move?: PreviewMove;
    moveIndex?: number;
  }> = [];
  let offset = 0;
  for (const [moveIndex, move] of moves.entries()) {
    const index = text.indexOf(move.text, offset);
    if (index < 0) continue;
    if (index > offset)
      parts.push({
        key: `text-${moveIndex}`,
        text: text.slice(offset, index)
      });
    parts.push({ key: `move-${moveIndex}`, text: move.text, move, moveIndex });
    offset = index + move.text.length;
  }
  if (offset < text.length)
    parts.push({ key: 'tail', text: text.slice(offset) });
  return parts;
}
