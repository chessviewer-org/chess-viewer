import {
  fairyCode,
  type FairyPieceType,
  type FairyRotation
} from '@constants/fairyPieces';
import { FAIRY_WALKS } from '@constants/fairyCatalogue';
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
  'K180',
  'K90',
  'K270',
  'P180',
  'P90',
  'P270',
  'Q180',
  'N180'
] as const;
const PREFERRED = STAND_INS.length - 2;
const LETTER_WALKS = FAIRY_WALKS.filter((walk) => !walk.glyph)
  .map((walk) => walk.code)
  .sort();

function candidates(walk: string): readonly string[] {
  const start = LETTER_WALKS.indexOf(walk) % PREFERRED;
  return [
    ...STAND_INS.slice(start, PREFERRED),
    ...STAND_INS.slice(0, start),
    ...STAND_INS.slice(PREFERRED)
  ];
}

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
  const glyphs = new Map<string, string>();
  for (const walk of [...walks].sort()) {
    const glyph = candidates(walk).find((option) => !taken.has(option));
    if (!glyph) continue;
    taken.add(glyph);
    glyphs.set(walk, glyph);
  }
  return glyphs;
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
