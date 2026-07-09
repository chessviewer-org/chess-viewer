import type { PieceSymbol } from '@app-types';

// Types
export interface ChessDragData {
  piece: PieceSymbol;

  pieceKey: string | null;

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

// Constants
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
