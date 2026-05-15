import { MAX_FEN_LENGTH } from '@/utils/validation';
import { BoardMatrix, PositionStats, ValidationResult, FENString, PieceSymbol } from '../types';

const VALID_PIECES = new Set([
  'p', 'n', 'b', 'r', 'q', 'k',
  'P', 'N', 'B', 'R', 'Q', 'K'
]);
const VALID_DIGITS = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);

function createEmptyBoard(): BoardMatrix {
  return Array.from({ length: 8 }, () => Array(8).fill('') as PieceSymbol[]);
}

/**
 * Parses a FEN string and returns an 8×8 board matrix.
 * Returns an empty board on any parse error.
 */
export function parseFEN(fenString: FENString): BoardMatrix {
  try {
    if (!fenString || typeof fenString !== 'string')
      throw new Error('Invalid FEN string');
    if (fenString.length > MAX_FEN_LENGTH)
      throw new Error('FEN string exceeds maximum length');
    
    const trimmed = fenString.trim();
    if (trimmed.length === 0) throw new Error('FEN string is empty');

    const position = trimmed.split(/\s+/)[0];
    const rows = position.split('/');
    if (rows.length !== 8)
      throw new Error(`Invalid FEN: expected 8 ranks, got ${rows.length}`);

    const board: BoardMatrix = [];
    for (const row of rows) {
      const boardRow: PieceSymbol[] = [];
      for (const char of row) {
        if (VALID_DIGITS.has(char)) {
          const count = parseInt(char, 10);
          for (let i = 0; i < count; i++) boardRow.push('');
        } else {
          if (!VALID_PIECES.has(char))
            throw new Error(`Invalid piece character: ${char}`);
          boardRow.push(char as PieceSymbol);
        }
      }
      if (boardRow.length !== 8)
        throw new Error(`Invalid rank length: ${boardRow.length}`);
      board.push(boardRow);
    }
    
    if (board.length !== 8)
      throw new Error(`Invalid board structure: ${board.length} ranks`);
    return board;
  } catch {
    return createEmptyBoard();
  }
}

/**
 * Validates the piece-placement field of a FEN string.
 */
export function validateFEN(fen: FENString): boolean {
  return getFENValidationError(fen) === '';
}

/**
 * Returns a short user-facing error for invalid piece placement.
 */
export function getFENValidationError(fen: FENString): string {
  try {
    if (!fen || typeof fen !== 'string') return 'FEN is empty';
    if (fen.length > MAX_FEN_LENGTH) return 'FEN string is too long';
    const position = fen.trim().split(/\s+/)[0];
    const rows = position.split('/');
    if (rows.length !== 8) return 'Board must have 8 ranks';
    
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      let count = 0;
      for (const char of row) {
        if (VALID_DIGITS.has(char)) {
          count += parseInt(char, 10);
        } else if (VALID_PIECES.has(char)) {
          count++;
        } else {
          return `Invalid piece character: ${char}`;
        }
      }
      if (count !== 8) {
        return `Rank ${rowIndex + 1} has ${count} squares`;
      }
    }
    return '';
  } catch {
    return 'Invalid FEN';
  }
}

/**
 * Validates a FEN string and returns highly specific, human-readable error messages.
 */
export function validateFENDetailed(fen: FENString): ValidationResult {
  if (!fen || typeof fen !== 'string') {
    return { isValid: false, errorMessage: 'Error: FEN string is empty or has an invalid format.' };
  }

  if (fen.length > MAX_FEN_LENGTH) {
    return { isValid: false, errorMessage: 'Error: FEN string is too long.' };
  }

  const trimmed = fen.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length !== 6) {
    return {
      isValid: false,
      errorMessage: `Error: A valid FEN must have exactly 6 parts. You provided ${parts.length}.`,
    };
  }

  const [position, activeColor, castling, enPassant, halfmove, fullmove] = parts;

  const rows = position.split('/');

  if (rows.length !== 8) {
    return {
      isValid: false,
      errorMessage: `Error: The board must have 8 ranks, but yours has ${rows.length}.`,
    };
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    let squareCount = 0;

    for (const char of row) {
      if (VALID_DIGITS.has(char)) {
        squareCount += parseInt(char, 10);
      } else if (VALID_PIECES.has(char)) {
        squareCount++;
      } else {
        return {
          isValid: false,
          errorMessage: `Error: Invalid character '${char}' in the piece placement field.`,
        };
      }
    }

    if (squareCount !== 8) {
      return {
        isValid: false,
        errorMessage: `Error: Rank ${rowIndex + 1} has ${squareCount} squares instead of 8.`,
      };
    }
  }

  if (activeColor !== 'w' && activeColor !== 'b') {
    return {
      isValid: false,
      errorMessage: "Error: Active color must be 'w' (white) or 'b' (black).",
    };
  }

  if (castling !== '-') {
    if (!/^[KQkq]{1,4}$/.test(castling)) {
      return { isValid: false, errorMessage: 'Error: Castling field is invalid.' };
    }
    const unique = new Set(castling);
    if (unique.size !== castling.length) {
      return { isValid: false, errorMessage: 'Error: Castling field contains duplicate characters.' };
    }
  }

  if (enPassant !== '-') {
    if (!/^[a-h][36]$/.test(enPassant)) {
      return {
        isValid: false,
        errorMessage: 'Error: En passant square is invalid (must be a file a-h on rank 3 or 6).',
      };
    }
  }

  if (!/^\d+$/.test(halfmove) || !/^\d+$/.test(fullmove)) {
    return {
      isValid: false,
      errorMessage: 'Error: Halfmove clock and fullmove number must be non-negative integers.',
    };
  }

  const fullmoveNum = parseInt(fullmove, 10);
  if (fullmoveNum < 1) {
    return {
      isValid: false,
      errorMessage: 'Error: Fullmove number must be at least 1.',
    };
  }

  return { isValid: true, errorMessage: null };
}

/**
 * Counts pieces for each side from a FEN string.
 */
export function getPositionStats(fen: FENString): PositionStats | null {
  try {
    const board = parseFEN(fen);
    const stats: PositionStats = {
      white: { pawns: 0, knights: 0, bishops: 0, rooks: 0, queens: 0, kings: 0 },
      black: { pawns: 0, knights: 0, bishops: 0, rooks: 0, queens: 0, kings: 0 }
    };
    for (const row of board) {
      for (const piece of row) {
        if (!piece) continue;
        const color = piece === piece.toUpperCase() ? 'white' : 'black';
        switch (piece.toLowerCase()) {
          case 'p': stats[color].pawns++; break;
          case 'n': stats[color].knights++; break;
          case 'b': stats[color].bishops++; break;
          case 'r': stats[color].rooks++; break;
          case 'q': stats[color].queens++; break;
          case 'k': stats[color].kings++; break;
          default: break;
        }
      }
    }
    return stats;
  } catch {
    return null;
  }
}

/**
 * Returns true if no pieces are present on the board
 */
export function isEmptyPosition(fen: FENString): boolean {
  try {
    return parseFEN(fen).every((row) => row.every((cell) => !cell));
  } catch {
    return false;
  }
}
