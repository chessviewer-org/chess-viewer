import type { ChessBoard } from '@app-types';
import { pieceOf, SPECS, type Color, type Spec } from './pieces';

export type { Color };

export interface Position {
  board: ChessBoard;
  turn: Color;
  castling: string;
  enPassant: string;
  halfmove: number;
  fullmove: number;
}

export interface Move {
  from: [number, number];
  to: [number, number];
  piece: string;
  capture: boolean;
  promotion?: string;
  kind?: 'enPassant' | 'castleShort' | 'castleLong';
}

const PROMOTIONS = ['q', 'r', 'b', 'n'] as const;
const CASTLE_RIGHTS: Record<string, string> = {
  '7,0': 'Q',
  '7,7': 'K',
  '0,0': 'q',
  '0,7': 'k'
};

const inside = (row: number, col: number) =>
  row >= 0 && row < 8 && col >= 0 && col < 8;
export const squareName = (row: number, col: number) =>
  `${'abcdefgh'[col]}${8 - row}`;
const squareCoords = (name: string): [number, number] => [
  8 - Number(name[1]),
  name.charCodeAt(0) - 97
];
const opponent = (color: Color): Color => (color === 'w' ? 'b' : 'w');

const HOME_RIGHTS: ReadonlyArray<[string, number, number, string]> = [
  ['K', 7, 7, 'R'],
  ['Q', 7, 0, 'R'],
  ['k', 0, 7, 'r'],
  ['q', 0, 0, 'r']
];

function validCastling(board: ChessBoard, castling: string): string {
  const kept = HOME_RIGHTS.filter(
    ([right, row, col, rook]) =>
      castling.includes(right) &&
      board[row]![col] === rook &&
      board[row]![4] === (right === right.toUpperCase() ? 'K' : 'k')
  ).map(([right]) => right);
  return kept.join('') || '-';
}

function validEnPassant(
  board: ChessBoard,
  turn: Color,
  enPassant: string
): string {
  if (!/^[a-h][36]$/.test(enPassant)) return '-';
  const [row, col] = squareCoords(enPassant);
  const dir = turn === 'w' ? 1 : -1;
  const pawn = turn === 'w' ? 'p' : 'P';
  const rank = turn === 'w' ? 2 : 5;
  return row === rank &&
    !board[row]![col] &&
    !board[row - dir]![col] &&
    board[row + dir]![col] === pawn
    ? enPassant
    : '-';
}

export function positionFromFen(board: ChessBoard, fen: string): Position {
  const [, side = 'w', castling = '-', enPassant = '-', half, full] = fen
    .trim()
    .split(/\s+/);
  const turn: Color = side === 'b' ? 'b' : 'w';
  return {
    board,
    turn,
    castling: validCastling(board, castling),
    enPassant: validEnPassant(board, turn, enPassant),
    halfmove: Number(half) || 0,
    fullmove: Number(full) || 1
  };
}

export function positionFenFields(position: Position): string {
  return `${position.turn} ${position.castling} ${position.enPassant} ${position.halfmove} ${position.fullmove}`;
}

function reach(
  board: ChessBoard,
  row: number,
  col: number,
  spec: Spec
): Array<[number, number]> {
  const squares: Array<[number, number]> = [];
  for (const [dr, dc] of spec.leap)
    if (inside(row + dr, col + dc)) squares.push([row + dr, col + dc]);
  for (const [dr, dc] of spec.ride)
    for (let r = row + dr, c = col + dc; inside(r, c); r += dr, c += dc) {
      squares.push([r, c]);
      if (pieceOf(board[r]![c]!)) break;
    }
  for (const [dr, dc] of spec.hop) {
    let r = row + dr;
    let c = col + dc;
    while (inside(r, c) && !pieceOf(board[r]![c]!)) {
      r += dr;
      c += dc;
    }
    if (inside(r + dr, c + dc)) squares.push([r + dr, c + dc]);
  }
  return squares;
}

const pawnStep = (mover: Color) => (mover === 'w' ? -1 : 1);

function isAttacked(
  board: ChessBoard,
  row: number,
  col: number,
  by: Color
): boolean {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const piece = pieceOf(board[r]![c]!);
      if (!piece || (piece.color !== by && piece.color !== 'n')) continue;
      if (piece.walk === 'P') {
        if (r + pawnStep(by) === row && Math.abs(c - col) === 1) return true;
        continue;
      }
      const spec = SPECS[piece.walk];
      if (
        spec &&
        reach(board, r, c, spec).some(([tr, tc]) => tr === row && tc === col)
      )
        return true;
    }
  return false;
}

export function kingSquare(
  board: ChessBoard,
  color: Color
): [number, number] | null {
  const king = color === 'w' ? 'K' : 'k';
  for (let row = 0; row < 8; row++) {
    const col = board[row]!.indexOf(king);
    if (col >= 0) return [row, col];
  }
  return null;
}

export function inCheck(position: Position, color: Color): boolean {
  const { board } = position;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const piece = pieceOf(board[r]![c]!);
      if (
        piece?.walk === 'K' &&
        piece.color === color &&
        isAttacked(board, r, c, opponent(color))
      )
        return true;
    }
  return false;
}

function promotionCell(cell: string, letter: string): string {
  const upper = letter.toUpperCase();
  if (cell.length === 2) return `n${upper}`;
  return cell === 'P' ? upper : letter;
}

function pseudoMoves(position: Position): Move[] {
  const { board, turn } = position;
  const moves: Move[] = [];
  const push = (
    from: [number, number],
    row: number,
    col: number,
    cell: string,
    extra: Partial<Move> = {}
  ) =>
    moves.push({
      from,
      to: [row, col],
      piece: cell,
      capture: !!pieceOf(board[row]![col]!) || extra.kind === 'enPassant',
      ...extra
    });
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = board[row]![col]!;
      const piece = pieceOf(cell);
      if (!piece || (piece.color !== turn && piece.color !== 'n')) continue;
      const from: [number, number] = [row, col];
      if (piece.walk === 'P') {
        const step = pawnStep(turn);
        const last = turn === 'w' ? 0 : 7;
        const start = turn === 'w' ? 6 : 1;
        const plain = /^n?[Pp]$/.test(cell);
        const addPawn = (r: number, c: number, extra: Partial<Move> = {}) => {
          if (r !== last || !plain) push(from, r, c, cell, extra);
          else
            for (const promotion of PROMOTIONS)
              push(from, r, c, cell, { ...extra, promotion });
        };
        if (inside(row + step, col) && !pieceOf(board[row + step]![col]!)) {
          addPawn(row + step, col);
          if (row === start && !pieceOf(board[row + 2 * step]![col]!))
            push(from, row + 2 * step, col, cell);
        }
        for (const dc of [-1, 1]) {
          const r = row + step;
          const c = col + dc;
          if (!inside(r, c)) continue;
          const target = pieceOf(board[r]![c]!);
          if (target && target.color !== turn) addPawn(r, c);
          else if (!target && position.enPassant !== '-') {
            const [er, ec] = squareCoords(position.enPassant);
            if (er === r && ec === c) addPawn(r, c, { kind: 'enPassant' });
          }
        }
        continue;
      }
      const spec = SPECS[piece.walk];
      if (!spec) continue;
      for (const [r, c] of reach(board, row, col, spec))
        if (pieceOf(board[r]![c]!)?.color !== turn) push(from, r, c, cell);
    }
  }
  const home = turn === 'w' ? 7 : 0;
  const king = turn === 'w' ? 'K' : 'k';
  const enemy = opponent(turn);
  if (board[home]![4] === king && !isAttacked(board, home, 4, enemy)) {
    const rook = turn === 'w' ? 'R' : 'r';
    const right = (side: string) =>
      position.castling.includes(turn === 'w' ? side : side.toLowerCase());
    const free = (cols: number[]) => cols.every((c) => !board[home]![c]);
    const safe = (cols: number[]) =>
      cols.every((c) => !isAttacked(board, home, c, enemy));
    if (right('K') && board[home]![7] === rook && free([5, 6]) && safe([5, 6]))
      push([home, 4], home, 6, king, { kind: 'castleShort' });
    if (
      right('Q') &&
      board[home]![0] === rook &&
      free([1, 2, 3]) &&
      safe([2, 3])
    )
      push([home, 4], home, 2, king, { kind: 'castleLong' });
  }
  return moves;
}

export function play(position: Position, move: Move): Position {
  const board = position.board.map((rank) => [...rank]);
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  board[tr]![tc] = move.promotion
    ? promotionCell(move.piece, move.promotion)
    : move.piece;
  board[fr]![fc] = '';
  if (move.kind === 'enPassant') board[fr]![tc] = '';
  if (move.kind === 'castleShort') {
    board[fr]![5] = board[fr]![7]!;
    board[fr]![7] = '';
  }
  if (move.kind === 'castleLong') {
    board[fr]![3] = board[fr]![0]!;
    board[fr]![0] = '';
  }
  const lost = new Set(
    [CASTLE_RIGHTS[`${fr},${fc}`], CASTLE_RIGHTS[`${tr},${tc}`]].filter(Boolean)
  );
  if (move.piece === 'K' || move.piece === 'k')
    for (const right of position.turn === 'w' ? 'KQ' : 'kq') lost.add(right);
  const castling =
    [...position.castling].filter((right) => !lost.has(right)).join('') || '-';
  const isPawn = pieceOf(move.piece)?.walk === 'P';
  return {
    board,
    turn: opponent(position.turn),
    castling,
    enPassant:
      isPawn && Math.abs(tr - fr) === 2 && /^[Pp]$/.test(move.piece)
        ? squareName((fr + tr) / 2, fc)
        : '-',
    halfmove: isPawn || move.capture ? 0 : position.halfmove + 1,
    fullmove: position.fullmove + (position.turn === 'b' ? 1 : 0)
  };
}

export function legalMoves(position: Position): Move[] {
  return pseudoMoves(position).filter(
    (move) => !inCheck(play(position, move), position.turn)
  );
}

export function destinations(
  position: Position,
  row: number,
  col: number
): Array<{ to: [number, number]; capture: boolean }> {
  const seen = new Set<string>();
  return legalMoves(position)
    .filter((move) => move.from[0] === row && move.from[1] === col)
    .filter((move) => !seen.has(`${move.to}`) && !!seen.add(`${move.to}`))
    .map(({ to, capture }) => ({ to, capture }));
}

export function parseUciMove(
  position: Position,
  uci: string,
  moves: Move[] = legalMoves(position)
): Move | undefined {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return undefined;
  const from = squareCoords(uci.slice(0, 2));
  const to = squareCoords(uci.slice(2, 4));
  return moves.find(
    (move) =>
      move.from[0] === from[0] &&
      move.from[1] === from[1] &&
      move.to[0] === to[0] &&
      move.to[1] === to[1] &&
      move.promotion === (uci[4] || undefined)
  );
}

export function sanMove(
  position: Position,
  move: Move,
  moves: Move[] = legalMoves(position)
): string {
  const walk = pieceOf(move.piece)?.walk ?? '';
  const type = walk === 'S' ? 'N' : walk;
  const target = squareName(...move.to);
  const origin = squareName(...move.from);
  let text: string;
  if (move.kind === 'castleShort') text = 'O-O';
  else if (move.kind === 'castleLong') text = 'O-O-O';
  else if (type === 'P') {
    text = `${move.capture ? `${origin[0]}x` : ''}${target}${move.promotion ? `=${move.promotion.toUpperCase()}` : ''}`;
  } else {
    const rivals = moves.filter(
      (other) =>
        other.from.join() !== move.from.join() &&
        other.piece === move.piece &&
        other.to[0] === move.to[0] &&
        other.to[1] === move.to[1]
    );
    const sameFile = rivals.some((other) => other.from[1] === move.from[1]);
    const sameRank = rivals.some((other) => other.from[0] === move.from[0]);
    const hint = !rivals.length
      ? ''
      : !sameFile
        ? origin[0]!
        : !sameRank
          ? origin[1]!
          : origin;
    text = `${type}${hint}${move.capture ? 'x' : ''}${target}`;
  }
  const next = play(position, move);
  if (!inCheck(next, next.turn)) return text;
  return `${text}${legalMoves(next).length ? '+' : '#'}`;
}
