import { PIECE_MAP } from '@constants';
import type { BoardCell } from '@app-types';
import { getPieceKey } from './pieceUtils';
import { isFairyFEN, parseFEN } from './fenParser';

export interface PieceImageRequest {
  readonly positions?: string | readonly string[];
  readonly board?: readonly (readonly BoardCell[])[];
  readonly selectedPiece?: BoardCell | null;
}

/** Include the standard palette, the actual board artwork and the held piece. */
export function requestedPieceKeys({
  positions = '',
  board,
  selectedPiece
}: PieceImageRequest): string[] {
  const keys = new Set(Object.keys(PIECE_MAP));
  const add = (cell: BoardCell) => {
    const key = getPieceKey(cell);
    if (key) keys.add(key);
  };
  if (board) {
    for (const row of board) for (const cell of row) add(cell);
  } else {
    for (const position of typeof positions === 'string'
      ? [positions]
      : positions) {
      if (!isFairyFEN(position)) continue;
      try {
        for (const row of parseFEN(position)) for (const cell of row) add(cell);
      } catch {
        /* Keep validation and error feedback in the owning editor. */
      }
    }
  }
  if (selectedPiece) add(selectedPiece);
  return [...keys].sort();
}
