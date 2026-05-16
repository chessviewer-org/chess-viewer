import { ChessBoard, PieceSymbol } from '@/types/chess';

/**
 * Creates an empty 8x8 chessboard matrix.
 * Used for initializing board states or when a FEN fails to parse.
 * 
 * @returns {ChessBoard} 8×8 matrix of empty strings
 */
export function createEmptyBoard(): ChessBoard {
  return Array.from({ length: 8 }, () => Array(8).fill('') as PieceSymbol[]);
}

/**
 * Compares two chessboards for strict piece-placement equality.
 * Evaluates row by row and cell by cell.
 *
 * @param {ChessBoard} board1 - First board state to compare
 * @param {ChessBoard} board2 - Second board state to compare
 * @returns {boolean} True if both boards have perfectly identical piece placements
 */
export function areBoardsEqual(board1: ChessBoard, board2: ChessBoard): boolean {
  if (!board1 || !board2) return false;
  if (board1.length !== board2.length) return false;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board1[row]?.[col] !== board2[row]?.[col]) return false;
    }
  }
  return true;
}

/**
 * Converts an 8×8 board matrix to a FEN position string.
 * This generates only the piece-placement field of a FEN string (e.g. "8/8/8/8...").
 * Consecutive empty squares are grouped into numbers.
 *
 * @param {ChessBoard} board - 8×8 board matrix containing PieceSymbols or empty strings
 * @returns {string} FEN piece-placement field
 */
export function boardToFEN(board: ChessBoard): string {
  if (!board || board.length !== 8) return '8/8/8/8/8/8/8/8';
  
  const rows: string[] = [];
  for (let row = 0; row < 8; row++) {
    let rowStr = '';
    let emptyCount = 0;
    
    for (let col = 0; col < 8; col++) {
      const piece = board[row]?.[col];
      if (piece) {
        if (emptyCount > 0) {
          rowStr += emptyCount;
          emptyCount = 0;
        }
        rowStr += piece;
      } else {
        emptyCount++;
      }
    }
    
    if (emptyCount > 0) rowStr += emptyCount;
    rows.push(rowStr || '8');
  }
  
  return rows.join('/');
}

/**
 * Checks if every square on the given board is entirely empty.
 *
 * @param {ChessBoard} board - 8×8 board matrix to evaluate
 * @returns {boolean} True if no pieces exist on the board
 */
export function isBoardEmpty(board: ChessBoard): boolean {
  if (!board || board.length !== 8) return true;
  return board.every((row) => row.every((cell) => cell === ''));
}
