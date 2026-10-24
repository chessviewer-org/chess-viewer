import type { BoardCell, ChessBoard } from '@app-types';
import { parseCellCode } from './boardCells';
import { isCompositionSymbol } from './compositionSymbols';
import {
  fairyAttribute,
  fairyWalk,
  namedCell,
  parseNamedCell
} from './fairyCells';

export interface PopeyeDocument {
  board: ChessBoard;
  commands: Array<{ keyword: string; value: string }>;
  fenMetadata: string;
  symbols: Record<string, string>;
}

const COLORS = { white: 'w', black: 'b', neutral: 'n' } as const;
const ORTHODOX: Record<string, string> = {
  K: 'K',
  Q: 'Q',
  R: 'R',
  B: 'B',
  N: 'S',
  P: 'P'
};
const KEYWORDS =
  'BeginProblem|EndProblem|Pieces|Forsyth|Condition|Stipulation|SStipulation|Option|Author|Origin|Title|Remark|Twin|ZeroPosition|Duplex|HalfDuplex';
export const MAX_COMPOSITION_LENGTH = 32768;
export const DEFAULT_FEN_METADATA = 'w - - 0 1';

export function popeyeStipulation(commands: PopeyeDocument['commands']) {
  // Popeye uses the last stipulation, including switches to/from SStipulation.
  for (let index = commands.length - 1; index >= 0; index--) {
    const command = commands[index]!;
    if (command.keyword === 'stipulation' || command.keyword === 'sstipulation')
      return command;
  }
  return undefined;
}

export function isPopeye(source: string): boolean {
  return /^\s*beginproblem\b/i.test(source);
}

function squareIndices(square: string): [number, number] {
  if (!/^[a-h][1-8]$/i.test(square))
    throw new Error(`Invalid square: ${square}.`);
  return [8 - Number(square[1]), square.toLowerCase().charCodeAt(0) - 97];
}

function put(board: ChessBoard, square: string, cell: BoardCell) {
  const [row, col] = squareIndices(square);
  if (board[row]![col])
    throw new Error(
      `More than one piece on ${square}. Underworld positions need separate diagrams.`
    );
  board[row]![col] = cell;
}

function parsePieces(value: string, board: ChessBoard) {
  let color: 'w' | 'b' | 'n' | null = null;
  let attrs: string[] = [];
  let walk: string | null = null;
  let placed = false;
  for (const raw of value.trim().split(/\s+/).filter(Boolean)) {
    const lower = raw.toLowerCase();
    if (lower in COLORS) {
      if (walk && !placed) throw new Error(`Missing squares for ${walk}.`);
      color = COLORS[lower as keyof typeof COLORS];
      attrs = [];
      walk = null;
      continue;
    }
    const attribute = fairyAttribute(raw);
    if (attribute) {
      attrs.push(attribute);
      continue;
    }
    if (!color)
      throw new Error(
        'Popeye pieces need White, Black or Neutral before the piece list.'
      );
    if (/^(?:[a-h][1-8])+$/i.test(raw) && walk) {
      for (const square of raw.match(/[a-h][1-8]/gi) ?? [])
        put(board, square, namedCell(color, walk, attrs));
      placed = true;
      continue;
    }
    if (fairyWalk(raw)) {
      if (walk && !placed) throw new Error(`Missing squares for ${walk}.`);
      placed = false;
      walk = raw.toUpperCase();
      continue;
    }
    const match = /^([a-z0-9]{1,2})((?:[a-h][1-8])+)$/i.exec(raw);
    if (!match || !fairyWalk(match[1]!))
      throw new Error(`Invalid Popeye piece: ${raw}.`);
    for (const square of match[2]!.match(/[a-h][1-8]/gi) ?? [])
      put(board, square, namedCell(color, match[1]!, attrs));
    walk = null;
  }
  if (walk && !placed) throw new Error(`Missing squares for ${walk}.`);
}

function parseForsyth(value: string, board: ChessBoard) {
  let index = 0;
  let offset = 0;
  const text = value.replace(/\s/g, '');
  while (offset < text.length) {
    if (text[offset] === '/') {
      offset++;
      continue;
    }
    const run = /^\d+/.exec(text.slice(offset));
    if (run) {
      index += Number(run[0]);
      offset += run[0].length;
    } else {
      const match = /^([+=-])?(?:\.([a-z0-9]{2})|([a-z]))/i.exec(
        text.slice(offset)
      );
      if (!match) throw new Error('Invalid Popeye Forsyth placement.');
      const code = match[2] ?? match[3]!;
      const color =
        match[1] === '='
          ? 'n'
          : match[1] === '+'
            ? 'w'
            : match[1] === '-'
              ? 'b'
              : code[0] === code[0]!.toUpperCase()
                ? 'w'
                : 'b';
      if (index >= 64) throw new Error('This editor uses an 8 × 8 board.');
      put(
        board,
        `${String.fromCharCode(97 + (index % 8))}${8 - Math.floor(index / 8)}`,
        namedCell(color, code)
      );
      offset += match[0].length;
      index++;
    }
    if (index > 64) throw new Error('This editor uses an 8 × 8 board.');
  }
}

export function parsePopeye(source: string): PopeyeDocument {
  if (source.length > MAX_COMPOSITION_LENGTH)
    throw new Error('The fairy composition is too long.');
  if (!isPopeye(source) || !/\bendproblem\s*$/i.test(source.trim()))
    throw new Error(
      'A Popeye diagram starts with BeginProblem and ends with EndProblem.'
    );
  const board: ChessBoard = Array.from({ length: 8 }, () =>
    Array<BoardCell>(8).fill('')
  );
  const doc: PopeyeDocument = {
    board,
    commands: [],
    fenMetadata: DEFAULT_FEN_METADATA,
    symbols: {}
  };
  const commands: Array<{ keyword: string; value: string }> = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const chunks = /^(?:remark|author|title|origin|twin)\b/i.test(line)
      ? [line]
      : line
          .split(new RegExp(`(?=\\b(?:${KEYWORDS})\\b)`, 'i'))
          .filter(Boolean);
    for (const chunk of chunks) {
      const command = new RegExp(`^(${KEYWORDS})\\b\\s*(.*)$`, 'i').exec(
        chunk.trim()
      );
      if (command)
        commands.push({
          keyword: command[1]!.toLowerCase(),
          value: command[2]!.trim()
        });
      else {
        const last = commands.at(-1);
        if (
          !last ||
          !['pieces', 'condition', 'option', 'sstipulation'].includes(
            last.keyword
          )
        )
          throw new Error(`Unknown Popeye line: ${chunk}.`);
        last.value += ` ${chunk.trim()}`;
      }
    }
  }
  let ends = 0;
  let begins = 0;
  for (const { keyword, value } of commands) {
    if (ends) throw new Error('Load one Popeye problem at a time.');
    if (keyword === 'beginproblem') {
      begins++;
      if (begins !== 1) throw new Error('Load one Popeye problem at a time.');
      if (value) throw new Error('Invalid BeginProblem command.');
      continue;
    }
    if (keyword === 'endproblem') {
      if (value) throw new Error('Invalid EndProblem command.');
      ends++;
      continue;
    }
    if (keyword === 'pieces') {
      parsePieces(value, board);
      continue;
    }
    if (keyword === 'forsyth') {
      parseForsyth(value, board);
      continue;
    }
    if (keyword === 'remark' && /^ChessViewerFEN\s/i.test(value)) {
      doc.fenMetadata = value.slice(15).trim();
      continue;
    }
    if (keyword === 'remark' && /^ChessViewerSymbols\s/i.test(value)) {
      for (const entry of value.slice(19).trim().split(/\s+/)) {
        const [square, symbol, extra] = entry.split('=');
        if (!square || !symbol || extra)
          throw new Error('Invalid diagram symbol override.');
        squareIndices(square);
        doc.symbols[square.toLowerCase()] = symbol;
      }
      continue;
    }
    doc.commands.push({ keyword, value });
  }
  if (ends !== 1) throw new Error('Load one Popeye problem at a time.');
  return doc;
}

export function popeyeCell(cell: BoardCell): {
  color: 'w' | 'b' | 'n';
  walk: string;
  attributes: string[];
  symbol?: string;
} {
  const named = parseNamedCell(cell);
  if (named)
    return {
      color: named.color,
      walk: named.walk,
      attributes: named.attributes
    };
  const match = /^([wbn])([KQRBNP])(90|180|270)?$/.exec(cell);
  const type = match?.[2] ?? cell.toUpperCase();
  const color =
    (match?.[1] as 'w' | 'b' | 'n' | undefined) ??
    (cell === cell.toUpperCase() ? 'w' : 'b');
  const walk = ORTHODOX[type];
  if (!walk) throw new Error(`Cannot encode piece ${cell} in Popeye.`);
  return {
    color,
    walk,
    attributes: [],
    ...(match?.[3] ? { symbol: cell } : {})
  };
}

export function serializePopeye(
  board: ChessBoard,
  context?: Pick<PopeyeDocument, 'commands' | 'fenMetadata'>
): string {
  const commands = context?.commands ?? [];
  const lines = [
    'BeginProblem',
    ...commands.map((command) => `${command.keyword} ${command.value}`.trim())
  ];
  if (context?.fenMetadata && context.fenMetadata !== DEFAULT_FEN_METADATA)
    lines.push(`Remark ChessViewerFEN ${context.fenMetadata}`);
  const symbols: string[] = [];
  const groups = new Map<string, string[]>();
  board.forEach((rank, row) =>
    rank.forEach((cell, col) => {
      if (!cell) return;
      const square = `${String.fromCharCode(97 + col)}${8 - row}`;
      const code = parseCellCode(cell);
      if (code && isCompositionSymbol(code.type) && !parseNamedCell(cell)) {
        symbols.push(`${square}=${cell}`);
        return;
      }
      const piece = popeyeCell(cell);
      if (piece.symbol) symbols.push(`${square}=${piece.symbol}`);
      const color = { w: 'White', b: 'Black', n: 'Neutral' }[piece.color];
      const key = [color, ...piece.attributes].join(' ');
      const list = groups.get(key) ?? [];
      list.push(`${piece.walk}${square}`);
      groups.set(key, list);
    })
  );
  if (symbols.length)
    lines.push(`Remark ChessViewerSymbols ${symbols.join(' ')}`);
  for (const [group, pieces] of groups)
    lines.push(`Pieces ${group} ${pieces.join(' ')}`);
  return [...lines, 'EndProblem'].join('\n');
}
