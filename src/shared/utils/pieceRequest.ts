import { PIECE_MAP } from '@constants';
import {
  FAIRY_COLORS,
  FAIRY_PIECE_TYPES,
  fairyCode,
  type FairyRotation
} from '@constants/fairyPieces';
import type { BoardCell } from '@app-types';
import { getPieceKey } from './pieceUtils';
import { isFairyFEN, parseFEN } from './fenParser';

export interface PieceImageRequest {
  readonly positions?: string | readonly string[];
  readonly board?: readonly (readonly BoardCell[])[];
  readonly palette?: 'standard' | 'fairy';
  readonly rotation?: FairyRotation;
  readonly selectedPiece?: BoardCell | null;
}

/** Include visible palette symbols and actual board artwork, never hidden turns. */
export function requestedPieceKeys({
  positions = '',
  board,
  palette = 'standard',
  rotation = 0,
  selectedPiece
}: PieceImageRequest): string[] {
  const keys = new Set(Object.keys(PIECE_MAP));
  const add = (cell: BoardCell) => {
    const key = getPieceKey(cell);
    if (key) keys.add(key);
  };
  if (palette === 'fairy') {
    for (const color of FAIRY_COLORS)
      for (const type of FAIRY_PIECE_TYPES)
        keys.add(fairyCode(color, type, rotation));
  }
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
  if (selectedPiece) {
    const key = getPieceKey(selectedPiece);
    if (key) {
      // A catalogue selection replaces one slot in each colour's palette.
      for (const color of FAIRY_COLORS) keys.add(color + key.slice(1));
    }
  }
  return [...keys].sort();
}
