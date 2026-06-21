import { BoardMatrix } from '@app-types';

/**
 * Returns an 8x8 matrix representing an empty chess board.
 *
 * @returns Empty board matrix
 */
export function createEmptyBoard(): BoardMatrix {
  return Array(8)
    .fill(null)
    .map(() => Array(8).fill(''));
}

/**
 * Converts an 8x8 board matrix into a FEN piece placement string.
 *
 * @param board - The board matrix to convert
 * @returns FEN piece placement string
 */
export function boardToFEN(board: BoardMatrix): string {
  const rows = [];
  for (let r = 0; r < 8; r++) {
    const row = board[r];
    if (!row) continue;
    let fenRow = '';
    let emptyCount = 0;
    for (let c = 0; c < 8; c++) {
      const piece = row[c];
      if (piece === '') {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fenRow += emptyCount.toString();
          emptyCount = 0;
        }
        fenRow += piece;
      }
    }
    if (emptyCount > 0) {
      fenRow += emptyCount.toString();
    }
    rows.push(fenRow);
  }
  return rows.join('/');
}

/**
 * Checks if a board matrix contains no pieces.
 *
 * @param board - The board matrix to check
 * @returns True if empty
 */
export function isBoardEmpty(board: BoardMatrix): boolean {
  return board.every((row) => row.every((piece) => piece === ''));
}

const PIECE_NAMES: Record<string, string> = {
  K: 'white king',
  Q: 'white queen',
  R: 'white rook',
  B: 'white bishop',
  N: 'white knight',
  P: 'white pawn',
  k: 'black king',
  q: 'black queen',
  r: 'black rook',
  b: 'black bishop',
  n: 'black knight',
  p: 'black pawn'
};

/**
 * Maps a single-character FEN piece symbol to a human-readable name
 * (e.g. `"K"` → `"white king"`) for screen-reader announcements.
 *
 * @param piece - FEN piece symbol
 * @returns Spoken piece name, or the raw symbol when unrecognised
 */
export function pieceToName(piece: string): string {
  return PIECE_NAMES[piece] ?? piece;
}

/**
 * Produces a succinct screen-reader description of a board position, grouped by
 * colour with algebraic coordinates that respect board orientation.
 *
 * @param board - The board matrix to describe
 * @param flipped - Whether the board is displayed from Black's perspective
 * @returns A spoken-language summary of every occupied square
 */
export function describeBoardPosition(
  board: BoardMatrix,
  flipped: boolean
): string {
  const white: string[] = [];
  const black: string[] = [];
  const files = 'abcdefgh';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r]?.[c];
      if (!piece) continue;
      const displayRow = flipped ? r : 7 - r;
      const displayCol = flipped ? 7 - c : c;
      const square = `${files[displayCol] ?? c}${displayRow + 1}`;
      const name = pieceToName(piece);
      if (piece === piece.toUpperCase()) white.push(`${name} ${square}`);
      else black.push(`${name} ${square}`);
    }
  }
  if (white.length === 0 && black.length === 0) return 'Empty board';
  const parts: string[] = [];
  if (white.length > 0) parts.push(`White: ${white.join(', ')}`);
  if (black.length > 0) parts.push(`Black: ${black.join(', ')}`);
  return parts.join('. ');
}
