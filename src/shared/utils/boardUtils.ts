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

/** 
 * Deep copies a board matrix. 
 * 
 * @param board - Source board matrix
 * @returns New board matrix copy
 */
export function copyBoard(board: BoardMatrix): BoardMatrix {
  return board.map((row) => [...row]);
}

/** 
 * Updates a specific square in a board matrix. 
 * 
 * @param board - The board matrix to modify
 * @param row - 0-indexed row
 * @param col - 0-indexed column
 * @param piece - New piece symbol
 * @returns Updated board matrix copy
 */
export function updateSquare(
  board: BoardMatrix,
  row: number,
  col: number,
  piece: PieceSymbol
): BoardMatrix {
  const newBoard = copyBoard(board);
  if (newBoard[row]) {
    newBoard[row][col] = piece;
  }
  return newBoard;
}

/** 
 * Resets a board matrix to the standard starting position. 
 * 
 * @returns Starting position board matrix
 */
export function resetToStartingPosition(): BoardMatrix {
  const startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  return parseFEN(startFEN);
}
