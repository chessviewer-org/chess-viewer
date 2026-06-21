import type {
  BoardMatrix,
  FENString,
  PieceSymbol,
  ValidationResult
} from '@app-types';

import { MAX_FEN_LENGTH } from './validation.ts';

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

function isPieceSymbol(char: string): char is PieceSymbol {
  return VALID_PIECES.has(char);
}
const VALID_DIGITS = new Set(['1', '2', '3', '4', '5', '6', '7', '8']);

/**
 * Custom error class for FEN parsing failures.
 */
export class FENParseError extends Error {
  /**
   * @param message - Descriptive error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'FENParseError';
  }
}

/**
 * Parses a FEN string and returns an 8×8 board matrix.
 *
 * @param fenString - The FEN string to parse
 * @returns An 8x8 matrix representing the board
 * @throws {FENParseError} If the FEN string is invalid
 */
export function parseFEN(fenString: FENString): BoardMatrix {
  if (!fenString || typeof fenString !== 'string')
    throw new FENParseError('Invalid FEN string');
  if (fenString.length > MAX_FEN_LENGTH)
    throw new FENParseError('FEN string exceeds maximum length');

  const trimmed = fenString.trim();
  if (trimmed.length === 0) throw new FENParseError('FEN string is empty');

  const position = trimmed.split(/\s+/)[0] ?? '';
  const rows = position.split('/');
  if (rows.length !== 8)
    throw new FENParseError(
      `Invalid FEN: expected 8 ranks, got ${rows.length}`
    );

  const board: BoardMatrix = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row === undefined) continue;
    const boardRow: PieceSymbol[] = [];
    let squareCount = 0;
    for (const char of row) {
      if (VALID_DIGITS.has(char)) {
        const count = parseInt(char, 10);
        squareCount += count;
        for (let i = 0; i < count; i++) boardRow.push('');
      } else {
        if (!isPieceSymbol(char))
          throw new FENParseError(
            `Invalid piece character '${char}' in rank ${rowIndex + 1}`
          );
        squareCount++;
        boardRow.push(char);
      }
    }
    if (squareCount !== 8)
      throw new FENParseError(
        `Rank ${rowIndex + 1} has ${squareCount} squares instead of 8`
      );
    board.push(boardRow);
  }

  if (board.length !== 8)
    throw new FENParseError(`Invalid board structure: ${board.length} ranks`);
  return board;
}

/**
 * Validates the piece-placement field of a FEN string.
 *
 * @param fen - The FEN string to validate
 * @returns True if the piece placement field is valid
 */
export function validateFEN(fen: FENString): boolean {
  return getFENValidationError(fen) === '';
}

/**
 * Returns a short user-facing error for invalid piece placement.
 *
 * @param fen - The FEN string to check
 * @returns Error message or an empty string if valid
 */
export function getFENValidationError(fen: FENString): string {
  try {
    if (!fen || typeof fen !== 'string') return 'FEN is empty';
    if (fen.length > MAX_FEN_LENGTH) return 'FEN string is too long';
    const position = fen.trim().split(/\s+/)[0] ?? '';
    const rows = position.split('/');
    if (rows.length !== 8) return 'Board must have 8 ranks';

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (row === undefined) continue;
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
 *
 * @param fen - The FEN string to validate
 * @returns Validation result object containing status and potential error message
 */
export function validateFENDetailed(fen: FENString): ValidationResult {
  if (!fen || typeof fen !== 'string') {
    return {
      isValid: false,
      errorMessage: 'Error: FEN string is empty or has an invalid format.'
    };
  }

  if (fen.length > MAX_FEN_LENGTH) {
    return { isValid: false, errorMessage: 'Error: FEN string is too long.' };
  }

  const trimmed = fen.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length !== 6) {
    return {
      isValid: false,
      errorMessage: `Error: A valid FEN must have exactly 6 parts. You provided ${parts.length}.`
    };
  }

  const position = parts[0] ?? '';
  const activeColor = parts[1];
  const castling = parts[2];
  const enPassant = parts[3];
  const halfmove = parts[4];
  const fullmove = parts[5];

  if (
    activeColor === undefined ||
    castling === undefined ||
    enPassant === undefined ||
    halfmove === undefined ||
    fullmove === undefined
  ) {
    return { isValid: false, errorMessage: 'Error: Missing FEN parts.' };
  }

  const rows = position.split('/');

  if (rows.length !== 8) {
    return {
      isValid: false,
      errorMessage: `Error: The board must have 8 ranks, but yours has ${rows.length}.`
    };
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row === undefined) continue;
    let squareCount = 0;

    for (const char of row) {
      if (VALID_DIGITS.has(char)) {
        squareCount += parseInt(char, 10);
      } else if (VALID_PIECES.has(char)) {
        squareCount++;
      } else {
        return {
          isValid: false,
          errorMessage: `Error: Invalid character '${char}' in the piece placement field.`
        };
      }
    }

    if (squareCount !== 8) {
      return {
        isValid: false,
        errorMessage: `Error: Rank ${rowIndex + 1} has ${squareCount} squares instead of 8.`
      };
    }
  }

  if (activeColor !== 'w' && activeColor !== 'b') {
    return {
      isValid: false,
      errorMessage: "Error: Active color must be 'w' (white) or 'b' (black)."
    };
  }

  if (castling !== '-') {
    if (!/^[KQkq]{1,4}$/.test(castling)) {
      return {
        isValid: false,
        errorMessage: 'Error: Castling field is invalid.'
      };
    }
    const unique = new Set(castling);
    if (unique.size !== castling.length) {
      return {
        isValid: false,
        errorMessage: 'Error: Castling field contains duplicate characters.'
      };
    }
  }

  if (enPassant !== '-') {
    if (!/^[a-h][36]$/.test(enPassant)) {
      return {
        isValid: false,
        errorMessage:
          'Error: En passant square is invalid (must be a file a-h on rank 3 or 6).'
      };
    }
  }

  if (!/^\d+$/.test(halfmove) || !/^\d+$/.test(fullmove)) {
    return {
      isValid: false,
      errorMessage:
        'Error: Halfmove clock and fullmove number must be non-negative integers.'
    };
  }

  const fullmoveNum = parseInt(fullmove, 10);
  if (fullmoveNum < 1) {
    return {
      isValid: false,
      errorMessage: 'Error: Fullmove number must be at least 1.'
    };
  }

  return { isValid: true, errorMessage: null };
}
