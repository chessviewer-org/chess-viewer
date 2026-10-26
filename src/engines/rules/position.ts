import type { ChessBoard } from '@app-types';
import type { BoardAnimation } from '../animation';
import { boardToFEN } from '@/shared/utils/boardCells';
import { parseFEN, positionContext } from '@/shared/utils/fenParser';
import {
  destinations,
  inCheck,
  legalMoves,
  play,
  positionFenFields,
  positionFromFen,
  type Position
} from './moves';
import { positionProblem } from './legality';
import { hasMoveRules } from './pieces';
import { orthodoxMoveAnimation } from './animation';

const ORTHODOX = /^[KQRBNPkqrbnp]?$/;

export const isOrthodoxBoard = (board: ChessBoard) =>
  board.every((rank) => rank.every((cell) => ORTHODOX.test(cell)));

export function checkedPosition(
  board: ChessBoard,
  fen: string,
  hypothetical = false
): Position {
  const position = positionFromFen(board, fen);
  const problem = positionProblem(position, hypothetical);
  if (problem) throw new Error(`Not a legal position. ${problem}`);
  return position;
}

export function positionFen(position: Position): string {
  return `${boardToFEN(position.board)} ${positionFenFields(position)}`;
}

export function livePosition(board: ChessBoard, fen: string): Position {
  return positionFromFen(board, `board ${positionContext(fen).fenMetadata}`);
}

export const rulesApply = (fen: string) =>
  !positionContext(fen).commands?.some(
    ({ keyword }) => keyword === 'condition'
  );

export function moveDestinations(
  board: ChessBoard,
  fen: string,
  row: number,
  col: number
) {
  return rulesApply(fen) && hasMoveRules(board[row]![col]!)
    ? destinations(livePosition(board, fen), row, col)
    : [];
}

export type BoardMove = {
  board: ChessBoard;
  fenMetadata: string;
  animation: BoardAnimation;
};

export function boardMove(
  fen: string,
  board: ChessBoard,
  from: [number, number],
  to: [number, number]
): BoardMove | 'free' | null {
  if (!rulesApply(fen) || !hasMoveRules(board[from[0]]![from[1]]!))
    return 'free';
  const position = livePosition(board, fen);
  const options = legalMoves(position).filter(
    (move) =>
      move.from[0] === from[0] &&
      move.from[1] === from[1] &&
      move.to[0] === to[0] &&
      move.to[1] === to[1]
  );
  const move = options.find((option) => option.promotion === 'q') ?? options[0];
  if (!move) return null;
  const next = play(position, move);
  return {
    board: next.board,
    fenMetadata: positionFenFields(next),
    animation: orthodoxMoveAnimation(position, move)
  };
}

export function flipTurn(fen: string): string {
  const [placement = '', turn = 'w', castling = '-', , half = '0', full = '1'] =
    fen.trim().split(/\s+/);
  return `${placement} ${turn === 'w' ? 'b' : 'w'} ${castling} - ${half} ${full}`;
}

export function mustAnswerCheck(fen: string): boolean {
  const board = parseFEN(fen);
  const position = livePosition(board, fen);
  return inCheck(position, position.turn);
}
