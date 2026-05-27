/**
 * A single chess piece character as used in FEN notation, or an empty string
 * for an empty square. Uppercase = white, lowercase = black.
 */
export type PieceSymbol =
  | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'
  | 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  | '';

/** 8×8 matrix of `PieceSymbol` values representing a board position. */
export type ChessBoard = PieceSymbol[][];

const PIECE_SYMBOL_SET = new Set<string>([
  'P', 'N', 'B', 'R', 'Q', 'K',
  'p', 'n', 'b', 'r', 'q', 'k', '',
]);

/** Type guard for `PieceSymbol`. */
export function isPieceSymbol(val: unknown): val is PieceSymbol {
  return typeof val === 'string' && PIECE_SYMBOL_SET.has(val);
}

/** Type guard that verifies an unknown value is an 8×8 `ChessBoard`. */
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

/** Full parsed FEN representation including metadata fields. */
export interface ChessPosition {
  fen: string;
  board: ChessBoard;
  activeColor?: 'w' | 'b';
  castlingAvailability?: string;
  enPassantTarget?: string;
  halfmoveClock?: number;
  fullmoveNumber?: number;
}
