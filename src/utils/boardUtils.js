/**
 * @returns {string[][]} 8×8 matrix of empty strings
 */
export function createEmptyBoard() {
  return Array.from({ length: 8 }, () => Array(8).fill(''));
}

/**
 * Converts an 8×8 board matrix to a FEN position string (piece placement only).
 *
 * @param {string[][]} board - 8×8 board matrix
 * @returns {string} FEN piece-placement field
 */
export function boardToFEN(board) {
  if (!board || board.length !== 8) return '8/8/8/8/8/8/8/8';
  const rows = [];
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
 * @param {string[][]} board - 8×8 board matrix
 * @returns {boolean} True if every square is empty
 */
export function isBoardEmpty(board) {
  if (!board || board.length !== 8) return true;
  return board.every((row) => row.every((cell) => cell === ''));
}
