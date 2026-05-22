export type PieceSymbol =
  | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'
  | 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  | '';

export type ChessBoard = PieceSymbol[][];

const PIECE_SYMBOL_SET = new Set<string>([
  'P', 'N', 'B', 'R', 'Q', 'K',
  'p', 'n', 'b', 'r', 'q', 'k', '',
]);

export function isPieceSymbol(val: unknown): val is PieceSymbol {
  return typeof val === 'string' && PIECE_SYMBOL_SET.has(val);
}

export function isChessBoard(val: unknown): val is ChessBoard {
  return (
    Array.isArray(val) &&
    val.length === 8 &&
    val.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 8 &&
        row.every(isPieceSymbol)
    )
  );
}

export interface ChessPosition {
  fen: string;
  board: ChessBoard;
  activeColor?: 'w' | 'b';
  castlingAvailability?: string;
  enPassantTarget?: string;
  halfmoveClock?: number;
  fullmoveNumber?: number;
}
