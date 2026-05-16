export type PieceSymbol =
  | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'
  | 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
  | '';

export type ChessBoard = PieceSymbol[][];

export interface ChessPosition {
  fen: string;
  board: ChessBoard;
  activeColor?: 'w' | 'b';
  castlingAvailability?: string;
  enPassantTarget?: string;
  halfmoveClock?: number;
  fullmoveNumber?: number;
}
