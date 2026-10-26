import type { PieceMotion } from '../animation';
import { namedCell } from '@/shared/utils/fairyCells';
import type { PreviewMove, SolutionLine } from '../core/types';

export interface PopeyeMove extends PreviewMove {
  intent: {
    from: number;
    to: number;
    capture: number;
    via: number;
    exchange: boolean;
  };
}

function decodePiece(cell: string) {
  if (!cell) return '';
  const color = cell[0];
  if (color !== 'w' && color !== 'b' && color !== 'n')
    throw new Error('Invalid color');
  const [walk, attributes] = cell.slice(1).split('~');
  return namedCell(color, walk!, attributes ? attributes.split(',') : []);
}

function decodeBoard(value: unknown) {
  if (typeof value !== 'string') throw new Error('Missing board');
  const cells = value.split(';');
  if (cells.length !== 65 || cells.pop() !== '')
    throw new Error('Invalid board');
  const decoded = cells.map(decodePiece);
  return Array.from({ length: 8 }, (_, row) =>
    decoded.slice(row * 8, row * 8 + 8)
  );
}

const square = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= -1 && Number(value) < 64;

export function decodePreviewMove(value: unknown): PopeyeMove | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<
    Record<
      | 'text'
      | 'board'
      | 'before'
      | 'from'
      | 'to'
      | 'capture'
      | 'exchange'
      | 'effects'
      | 'exact',
      unknown
    >
  >;
  if (
    typeof data.text !== 'string' ||
    !square(data.from) ||
    !square(data.to) ||
    !square(data.capture) ||
    !Array.isArray(data.effects)
  )
    return null;
  try {
    const board = decodeBoard(data.board);
    const before = decodeBoard(data.before);
    const motions = new Map<number, PieceMotion>();
    let via = -1;
    for (const raw of data.effects) {
      if (!raw || typeof raw !== 'object') throw new Error('Invalid effect');
      const effect = raw as Partial<
        Record<'id' | 'from' | 'to' | 'via' | 'piece' | 'kind', unknown>
      >;
      if (
        !Number.isInteger(effect.id) ||
        Number(effect.id) < 1 ||
        Number(effect.id) > 64 ||
        !square(effect.from) ||
        !square(effect.to) ||
        !square(effect.via) ||
        typeof effect.piece !== 'string'
      )
        throw new Error('Invalid effect');
      const id = Number(effect.id);
      let motion = motions.get(id);
      if (!motion) {
        motion = {
          id,
          piece: decodePiece(effect.piece),
          path: [],
          removed: false
        };
        motions.set(id, motion);
      }
      const append = (index: number) => {
        if (index >= 0 && motion!.path.at(-1) !== index)
          motion!.path.push(index);
      };
      if (effect.kind === 'move') {
        append(effect.from);
        append(effect.via);
        append(effect.to);
        motion.removed = false;
        if (effect.from === data.from) via = effect.via;
      } else if (effect.kind === 'remove') {
        append(effect.from);
        motion.removed = true;
      } else if (effect.kind === 'add') {
        append(effect.to);
        motion.removed = false;
      } else throw new Error('Unknown effect');
    }
    return {
      text: data.text.trim(),
      board,
      intent: {
        from: data.from,
        to: data.to,
        capture: data.capture,
        via,
        exchange: data.exchange === true
      },
      ...(data.exact === true && motions.size
        ? { animation: { before, motions: [...motions.values()] } }
        : {})
    };
  } catch {
    return null;
  }
}

export function analysisProblemError(output: string): string | undefined {
  return output
    .split('\n')
    .map((line) => line.trim())
    .find((line) =>
      /fatal error|input-error|both sides need a king|only one king allowed|can capture the king|could not recognize|not supported|not allowed|incompatible|problem ignored|wrong or missing|too less main memory|couldn.t allocate/i.test(
        line
      )
    );
}

export function solutionLines(
  output: string,
  positions: readonly PreviewMove[] = []
): SolutionLine[] {
  const lines = output.replace(/\r/g, '').split('\n');
  const moves = lines.filter((line) => /^\s*\d+\.(?:\.\.)?\S/.test(line));
  if (!moves.length) return [];
  const indentation = Math.min(
    ...moves.map((line) => line.length - line.trimStart().length)
  );
  const solutions: SolutionLine[] = [];
  let current: SolutionLine | undefined;
  let cursor = 0;
  for (const [lineNumber, line] of lines.entries()) {
    const trimmed = line.trim();
    if (!/^\d+\.(?:\.\.)?\S/.test(trimmed)) continue;
    if (line.length - line.trimStart().length === indentation) {
      current = { id: lineNumber, key: trimmed, variations: [], moves: [] };
      solutions.push(current);
    }
    const row = {
      id: lineNumber,
      text: line.slice(indentation).trimEnd(),
      moves: [] as PreviewMove[]
    };
    const isKey = current?.id === lineNumber;
    if (!isKey) current?.variations.push(row);
    let offset = 0;
    while (cursor < positions.length) {
      const move = positions[cursor]!;
      const index = line.indexOf(move.text, offset);
      if (index === -1 || !move.text) break;
      if (isKey) current?.moves.push(move);
      else row.moves.push(move);
      offset = index + move.text.length;
      cursor++;
    }
  }
  return solutions;
}
