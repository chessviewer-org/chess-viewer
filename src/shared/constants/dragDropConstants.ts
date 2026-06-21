import type { PieceSymbol } from '@app-types';

/**
 * Typed payload attached to every @dnd-kit drag item via `useDraggable({ data })`.
 * Consumed by `ChessEditor.handleDragEnd` and `DragOverlay` to identify the
 * dragged piece and its origin.
 */
export interface ChessDragData {
  piece: PieceSymbol;
  /** Image map key e.g. 'wK', 'bP' — null for empty squares (should not happen). */
  pieceKey: string | null;
  /** undefined when the piece originates from the palette. */
  fromRow?: number | undefined;
  fromCol?: number | undefined;
  isFromPalette: boolean;
}

export interface PalettePiece {
  id: string;
  piece: PieceSymbol;
  color: 'w' | 'b';
  name: string;
}

export const PALETTE_PIECES: PalettePiece[] = [
  { id: 'wK', piece: 'K', color: 'w', name: 'White King' },
  { id: 'wQ', piece: 'Q', color: 'w', name: 'White Queen' },
  { id: 'wR', piece: 'R', color: 'w', name: 'White Rook' },
  { id: 'wB', piece: 'B', color: 'w', name: 'White Bishop' },
  { id: 'wN', piece: 'N', color: 'w', name: 'White Knight' },
  { id: 'wP', piece: 'P', color: 'w', name: 'White Pawn' },
  { id: 'bK', piece: 'k', color: 'b', name: 'Black King' },
  { id: 'bQ', piece: 'q', color: 'b', name: 'Black Queen' },
  { id: 'bR', piece: 'r', color: 'b', name: 'Black Rook' },
  { id: 'bB', piece: 'b', color: 'b', name: 'Black Bishop' },
  { id: 'bN', piece: 'n', color: 'b', name: 'Black Knight' },
  { id: 'bP', piece: 'p', color: 'b', name: 'Black Pawn' }
];

/**
 * Returns the image map key for a given FEN character.
 *
 * @param fenChar - FEN piece character (e.g. 'P', 'k')
 * @returns Image key (e.g. 'wP', 'bK') or null when input is falsy
 */
export function getPieceImageKey(fenChar: PieceSymbol): string | null {
  if (!fenChar) return null;
  const color = fenChar === fenChar.toUpperCase() ? 'w' : 'b';
  return color + fenChar.toUpperCase();
}
