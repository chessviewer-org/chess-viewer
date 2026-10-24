import {
  fairyCode,
  type FairyPieceType,
  type FairyRotation
} from '@constants/fairyPieces';
import { FAIRY_WALKS } from '@constants/fairyCatalogue';
import type { BoardCell } from '@app-types';
import { parseCellCode } from './boardCells';
import { parseNamedCell } from './fairyCells';

const FAMOUS = ['Q180', 'N180'];
const GLYPH_USE = new Map<string, number>();
for (const walk of FAIRY_WALKS)
  if (walk.glyph)
    GLYPH_USE.set(walk.glyph, (GLYPH_USE.get(walk.glyph) ?? 0) + 1);
const STAND_INS = [
  ...['K', 'Q', 'R', 'B', 'N', 'P']
    .flatMap((type) => ['90', '180', '270'].map((turn) => type + turn))
    .filter((glyph) => !FAMOUS.includes(glyph))
    .sort((a, b) => (GLYPH_USE.get(a) ?? 0) - (GLYPH_USE.get(b) ?? 0)),
  ...FAMOUS
];
const LETTER_WALKS = new Set(
  FAIRY_WALKS.filter((walk) => !walk.glyph).map((walk) => walk.code)
);

const MEMORY_KEY = 'fairy-stand-ins';

function readMemory(): Map<string, string> {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(MEMORY_KEY) ?? '{}'
    );
    if (typeof stored !== 'object' || stored === null) return new Map();
    return new Map(
      Object.entries(stored).filter(
        (entry): entry is [string, string] =>
          LETTER_WALKS.has(entry[0]) && STAND_INS.includes(entry[1])
      )
    );
  } catch {
    return new Map();
  }
}

const memory = readMemory();

function remember(walk: string, glyph: string) {
  for (const [other, claimed] of memory)
    if (claimed === glyph) memory.delete(other);
  memory.set(walk, glyph);
  try {
    localStorage.setItem(
      MEMORY_KEY,
      JSON.stringify(Object.fromEntries(memory))
    );
  } catch {
    /* Shapes still stay stable for this session. */
  }
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
  const ordered = [...walks].sort();
  for (const walk of ordered) {
    const glyph = memory.get(walk);
    if (!glyph || taken.has(glyph) || [...glyphs.values()].includes(glyph))
      continue;
    glyphs.set(walk, glyph);
  }
  const used = new Set([...taken, ...glyphs.values()]);
  for (const walk of ordered) {
    if (glyphs.has(walk)) continue;
    const glyph = STAND_INS.find((option) => !used.has(option));
    if (!glyph) continue;
    used.add(glyph);
    glyphs.set(walk, glyph);
    remember(walk, glyph);
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
