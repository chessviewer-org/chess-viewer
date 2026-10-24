import {
  FENParseError,
  MAX_FEN_LENGTH,
  parseFEN as parseStandardFEN,
  validateFENDetailed as validateStandardFEN,
  type ValidationResult
} from '@chessviewer-org/chess-viewer';

import type { BoardCell, ChessBoard } from '@app-types';
import { baseCells, boardToFEN } from './boardCells';
import { isCompositionSymbol } from './compositionSymbols';
import { parseNamedCell } from './fairyCells';
import { memoizeString } from './memoize';
import {
  DEFAULT_FEN_METADATA,
  MAX_COMPOSITION_LENGTH,
  isPopeye,
  parsePopeye,
  serializePopeye,
  type PopeyeDocument
} from './popeye';

// FFEN adds at most three prefix characters to each of the 64 pieces.
// The orthodox FEN limit remains owned by the chess-viewer library.
export const MAX_FFEN_LENGTH = MAX_FEN_LENGTH + 64 * 3;
export const MAX_POSITION_LENGTH = MAX_COMPOSITION_LENGTH;

/** Joost de Heer's FFEN: '-' = neutral; '*1', '*2', '*3' = clockwise turns.
 * https://www.janko.at/Retros/d.htm#Fairy_FEN
 * C/X/S/T are diagram circles, crosses, squares and triangles, not walks.
 */
export function isFairyFEN(fen: string): boolean {
  return isPopeye(fen) || /[-*CXSTcxst]/.test(fen.trim().split(/\s+/)[0] ?? '');
}

function parsePlacement(placement: string): ChessBoard {
  const ranks = placement.split('/');
  if (ranks.length !== 8)
    throw new FENParseError('The board must have 8 ranks.');
  return ranks.map((rank, index) => {
    const cells: BoardCell[] = [];
    let offset = 0;
    while (offset < rank.length) {
      const token =
        /^(?:[1-8]|(-)?(?:\*([0-3]))?([KQRBNPCXSTkqrbnpcxst]))/.exec(
          rank.slice(offset)
        );
      if (!token) {
        throw new FENParseError(
          `Invalid FFEN symbol in rank ${index + 1}. Use -B, *1B or -*2r.`
        );
      }
      offset += token[0].length;
      if (/^[1-8]$/.test(token[0])) {
        cells.push(...Array<BoardCell>(Number(token[0])).fill(''));
      } else {
        const symbol = token[3]!;
        const rotation = Number(token[2] ?? 0) * 90;
        const color = token[1]
          ? 'n'
          : symbol === symbol.toUpperCase()
            ? 'w'
            : 'b';
        cells.push(
          color === 'n' || rotation || isCompositionSymbol(symbol.toUpperCase())
            ? `${color}${symbol.toUpperCase()}${rotation || ''}`
            : symbol
        );
      }
      if (cells.length > 8)
        throw new FENParseError(`Rank ${index + 1} has more than 8 squares.`);
    }
    if (cells.length !== 8)
      throw new FENParseError(
        `Rank ${index + 1} has ${cells.length} squares instead of 8.`
      );
    return cells;
  });
}

export function parseFEN(fen: string): ChessBoard {
  if (typeof fen !== 'string' || !fen.trim())
    throw new FENParseError('FEN is empty.');
  if (isPopeye(fen)) {
    const doc = parsePopeye(fen);
    for (const [square, symbol] of Object.entries(doc.symbols)) {
      if (!/^[wbn][KQRBNPCXST](?:90|180|270)?$/.test(symbol))
        throw new FENParseError('Invalid diagram symbol override.');
      const row = 8 - Number(square[1]);
      const col = square.charCodeAt(0) - 97;
      if (isCompositionSymbol(symbol[1]!) && doc.board[row]![col])
        throw new FENParseError('A diagram marker cannot replace a piece.');
      if (parseNamedCell(doc.board[row]![col]!))
        throw new FENParseError(
          'A named fairy piece cannot be replaced by a visual-only symbol.'
        );
      doc.board[row]![col] = symbol;
    }
    return doc.board;
  }
  if (!isFairyFEN(fen)) return parseStandardFEN(fen);
  if (fen.length > MAX_FFEN_LENGTH)
    throw new FENParseError('FFEN string is too long.');
  return parsePlacement(fen.trim().split(/\s+/)[0] ?? '');
}

function computeFENValidation(fen: string): ValidationResult {
  try {
    const board = parseFEN(fen);
    const parts = (
      isPopeye(fen) ? `board ${parsePopeye(fen).fenMetadata}` : fen.trim()
    ).split(/\s+/);
    // Composition diagrams commonly supply only the placement field.
    const metadata =
      parts.length === 1 ? ['w', '-', '-', '0', '1'] : parts.slice(1);
    const standardPlacement = boardToFEN(baseCells(board));
    return validateStandardFEN([standardPlacement, ...metadata].join(' '));
  } catch (error: unknown) {
    return {
      isValid: false,
      errorMessage: error instanceof Error ? error.message : 'Invalid FEN.'
    };
  }
}

export const validateFENDetailed = memoizeString((fen) =>
  Object.freeze(computeFENValidation(fen))
);

export function validateFEN(fen: string): boolean {
  return validateFENDetailed(fen).isValid;
}

export function getFENValidationError(fen: string): string {
  return validateFENDetailed(fen).errorMessage ?? '';
}

export function normalizePositionFEN(fen: string): string {
  const result = validateFENDetailed(fen);
  if (!result.isValid)
    throw new FENParseError(result.errorMessage ?? 'Invalid FEN.');
  if (isPopeye(fen)) return serializePopeye(parseFEN(fen), parsePopeye(fen));
  const fields = fen.trim().split(/\s+/);
  const metadata =
    fields.length === 1 ? ['w', '-', '-', '0', '1'] : fields.slice(1);
  return [boardToFEN(parseFEN(fen)), ...metadata].join(' ');
}

export interface PositionContext {
  fenMetadata: string;
  commands?: PopeyeDocument['commands'];
}

export function positionContext(source: string): PositionContext {
  if (isPopeye(source)) {
    const { fenMetadata, commands } = parsePopeye(source);
    return { fenMetadata, commands };
  }
  const fields = source.trim().split(/\s+/);
  return {
    fenMetadata:
      fields.length > 1 ? fields.slice(1).join(' ') : DEFAULT_FEN_METADATA
  };
}

export function serializePosition(
  board: ChessBoard,
  context: PositionContext = { fenMetadata: DEFAULT_FEN_METADATA }
): string {
  if (
    context.commands ||
    board.some((rank) => rank.some((cell) => parseNamedCell(cell)))
  )
    return serializePopeye(board, {
      commands: context.commands ?? [],
      fenMetadata: context.fenMetadata
    });
  return `${boardToFEN(board)} ${context.fenMetadata}`;
}
