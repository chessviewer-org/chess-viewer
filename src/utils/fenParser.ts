import { MAX_FEN_LENGTH } from '@/utils/validation';

const VALID_PIECES = new Set([
  'p',
  'n',
  'b',
  'r',
  'q',
  'k',
  'P',
  'N',
  'B',
  'R',
  'Q',
  'K'
]);
const VALID_DIGITS = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);

function createEmptyBoard() {
  return Array.from({ length: 8 }, () => Array(8).fill(''));
}

/**
 * Parses a FEN string and returns an 8×8 board matrix.
 * Returns an empty board on any parse error.
 *
 * @param {string} fenString - FEN notation string
 * @returns {string[][]} 8×8 board matrix
 */
export function parseFEN(fenString: string): string[][] {
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
      throw new Error('Invalid FEN: expected 8 ranks, got ' + rows.length);

    const board: string[][] = [];
    for (const row of rows) {
      const boardRow: string[] = [];
      for (const char of row) {
        if (VALID_DIGITS.has(char)) {
          const count = parseInt(char, 10);
          for (let i = 0; i < count; i++) boardRow.push('');
        } else {
          if (!VALID_PIECES.has(char))
            throw new Error('Invalid piece character: ' + char);
          boardRow.push(char);
        }
      }
      if (boardRow.length !== 8)
        throw new Error('Invalid rank length: ' + boardRow.length);
      board.push(boardRow);
    }
    if (board.length !== 8)
      throw new Error('Invalid board structure: ' + board.length + ' ranks');
    return board;
  } catch {
    return createEmptyBoard();
  }
}

/**
 * Validates the piece-placement field of a FEN string.
 *
 * @param {string} fen - FEN notation string
 * @returns {boolean} True if the FEN piece placement is valid
 */
export function validateFEN(fen: string): boolean {
  return getFENValidationError(fen) === '';
}

/**
 * Returns a short user-facing error for invalid piece placement.
 *
 * @param {string} fen - FEN notation string
 * @returns {string} Empty string when valid
 */
export function getFENValidationError(fen: string): string {
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
          return 'Invalid piece character: ' + char;
        }
      }
      if (count !== 8) {
        return 'Rank ' + (rowIndex + 1) + ' has ' + count + ' squares';
      }
    }
    return '';
  } catch {
    return 'Invalid FEN';
  }
}

/**
 * Validates a FEN string and returns highly specific, human-readable error messages.
 * Checks are performed in strict order: length → structure → piece placement →
 * active color → castling → en passant → move counters.
 *
 * @param fen - Full FEN notation string
 * @returns Validation result with a detailed error message (null when valid)
 */
export function validateFENDetailed(fen: string): { isValid: boolean; errorMessage: string | null } {
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
