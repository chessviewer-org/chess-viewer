import { BoardMatrix, PieceSymbol } from '../types/index';
import { parseFEN } from './fenParser';

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
