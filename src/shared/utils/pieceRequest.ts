import { PIECE_MAP } from '@constants';
import type { BoardCell } from '@app-types';
import { getPieceKey } from './pieceUtils';
import { isFairyFEN, parseFEN } from './fenParser';
import { standInCell, standInGlyphs } from './standInGlyphs';

export interface PieceImageRequest {
  readonly positions?: string | readonly string[];
  readonly board?: readonly (readonly BoardCell[])[];
  readonly selectedPiece?: BoardCell | null;
}

function requestedCells({
  positions = '',
  board,
  selectedPiece
}: PieceImageRequest): BoardCell[] {
  const cells: BoardCell[] = [];
  if (board) {
    for (const row of board) cells.push(...row);
  } else {
    for (const position of typeof positions === 'string'
      ? [positions]
      : positions) {
      if (!isFairyFEN(position)) continue;
      try {
        cells.push(...parseFEN(position).flat());
      } catch {
        /* Keep validation and error feedback in the owning editor. */
      }
    }
  }
  if (selectedPiece) cells.push(selectedPiece);
  return cells;
}

export function requestedPieceMap(
  request: PieceImageRequest
): Record<string, string> {
  const cells = requestedCells(request);
  const glyphs = standInGlyphs(cells);
  const map: Record<string, string> = Object.fromEntries(
    Object.keys(PIECE_MAP).map((key) => [key, ''])
  );
  for (const cell of cells) {
    const key = getPieceKey(cell);
    if (!key) continue;
    const source = getPieceKey(standInCell(cell, glyphs));
    map[key] = source && source !== key ? source : '';
  }
  return Object.fromEntries(
    Object.entries(map).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  );
}
