import { parseFEN, normalizePositionFEN } from '@/shared/utils/fenParser';
import {
  checkedPosition,
  isOrthodoxBoard,
  positionFen
} from '../rules/position';
import { inCheck, legalMoves, type Move, type Position } from '../rules/moves';

export interface SearchInput {
  fen: string;
  position: Position;
  moves: Move[];
}

export function buildSearchInput(
  source: string,
  hypothetical = false
): SearchInput {
  const normalized = normalizePositionFEN(source);
  const board = parseFEN(normalized);
  if (!isOrthodoxBoard(board))
    throw new Error(
      'Stockfish plays orthodox chess. Use standard pieces only.'
    );
  const position = checkedPosition(board, normalized, hypothetical);
  return {
    fen: positionFen(position),
    position,
    moves: legalMoves(position)
  };
}

export function gameEndMessage({ position, moves }: SearchInput): string {
  if (moves.length) return '';
  return inCheck(position, position.turn)
    ? `Checkmate. ${position.turn === 'w' ? 'Black' : 'White'} wins.`
    : 'Stalemate. The game is drawn.';
}
