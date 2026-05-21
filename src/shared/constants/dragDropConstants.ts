import { PieceSymbol } from '@app-types/chess';

export const ItemTypes = {
  PIECE: 'piece'
};

export interface PalettePiece {
  id: string;
  piece: PieceSymbol;
  color: 'w' | 'b';
  name: string;
}

export const PALETTE_PIECES: PalettePiece[] = [
  {
    id: 'wK',
    piece: 'K',
    color: 'w',
    name: 'White King'
  },
  {
    id: 'wQ',
    piece: 'Q',
    color: 'w',
    name: 'White Queen'
  },
  {
    id: 'wR',
    piece: 'R',
    color: 'w',
    name: 'White Rook'
  },
  {
    id: 'wB',
    piece: 'B',
    color: 'w',
    name: 'White Bishop'
  },
  {
    id: 'wN',
    piece: 'N',
    color: 'w',
    name: 'White Knight'
  },
  {
    id: 'wP',
    piece: 'P',
    color: 'w',
    name: 'White Pawn'
  },
  {
    id: 'bK',
    piece: 'k',
    color: 'b',
    name: 'Black King'
  },
  {
    id: 'bQ',
    piece: 'q',
    color: 'b',
    name: 'Black Queen'
  },
  {
    id: 'bR',
    piece: 'r',
    color: 'b',
    name: 'Black Rook'
  },
  {
    id: 'bB',
    piece: 'b',
    color: 'b',
    name: 'Black Bishop'
  },
  {
    id: 'bN',
    piece: 'n',
    color: 'b',
    name: 'Black Knight'
  },
  {
    id: 'bP',
    piece: 'p',
    color: 'b',
    name: 'Black Pawn'
  }
];

/**
 * Returns the FEN character for a piece given color and type.
 *
 * @param {'w'|'b'} color - Piece color
 * @param {string} pieceType - Lowercase piece type (e.g. 'p', 'n')
 * @returns {string} FEN piece character
 */
export function getPieceFenChar(color: 'w' | 'b', pieceType: string): string {
  return color === 'w' ? pieceType.toUpperCase() : pieceType.toLowerCase();
}

/**
 * Returns the image key used in the piece images map for a given FEN character.
 *
 * @param {PieceSymbol} fenChar - FEN piece character (e.g. 'P', 'k')
 * @returns {string|null} Image key (e.g. 'wP', 'bK') or null if input is empty
 */
export function getPieceImageKey(fenChar: PieceSymbol): string | null {
  if (!fenChar) return null;
  const color = fenChar === fenChar.toUpperCase() ? 'w' : 'b';
  return color + fenChar.toUpperCase();
}
