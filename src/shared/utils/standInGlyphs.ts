import {
  fairyCode,
  type FairyPieceType,
  type FairyRotation
} from '@constants/fairyPieces';
import type { BoardCell } from '@app-types';
import { parseCellCode } from './boardCells';
import { parseNamedCell } from './fairyCells';

const STAND_INS = [
  'R180',
  'B180',
  'Q90',
  'R90',
  'B90',
  'N90',
  'Q270',
  'R270',
  'B270',
  'N270',
  'Q180',
  'N180',
  'K180',
  'K90',
  'K270',
  'P180',
  'P90',
  'P270'
] as const;

export function standInGlyphs(cells: Iterable<BoardCell>): Map<string, string> {
  const taken = new Set<string>();
  const walks = new Set<string>();
  for (const cell of cells) {
    const named = parseNamedCell(cell);
    if (named && !named.definition.glyph) {
      walks.add(named.walk);
      continue;
    }
    const code = parseCellCode(cell);
    if (code) taken.add(`${code.type}${code.rotation || ''}`);
  }
  const free = STAND_INS.filter((glyph) => !taken.has(glyph));
  return new Map(
    [...walks]
      .sort()
      .flatMap((walk, index) =>
        free[index] ? [[walk, free[index]] as const] : []
      )
  );
}

export function standInCell(
  cell: BoardCell,
  glyphs: ReadonlyMap<string, string>
): BoardCell {
  const named = parseNamedCell(cell);
  const glyph = named && glyphs.get(named.walk);
  return glyph
    ? fairyCode(
        named.color,
        glyph[0] as FairyPieceType,
        Number(glyph.slice(1)) as FairyRotation
      )
    : cell;
}

export function standInBoard(
  board: readonly (readonly BoardCell[])[]
): BoardCell[][] {
  const glyphs = standInGlyphs(board.flat());
  return board.map((rank) => rank.map((cell) => standInCell(cell, glyphs)));
}
