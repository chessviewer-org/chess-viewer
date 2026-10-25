import type { ChessBoard } from '@app-types';
import { parseCellCode } from '@/shared/utils/boardCells';
import { parseNamedCell } from '@/shared/utils/fairyCells';
import { parseFEN, validateFENDetailed } from '@/shared/utils/fenParser';
import {
  isPopeye,
  parsePopeye,
  popeyeStipulation,
  serializePopeye
} from '@/shared/utils/popeye';
import { checkedPosition, isOrthodoxBoard } from '../rules/position';
import type { AnalysisSettings } from './settings';

export function compositionStipulation(fen: string): string {
  return isPopeye(fen)
    ? (popeyeStipulation(parsePopeye(fen).commands)?.value ?? '#2')
    : '#2';
}

export function buildAnalysisInput(
  fen: string,
  stipulation: string,
  settings: AnalysisSettings
): string {
  const validation = validateFENDetailed(fen);
  if (!validation.isValid) throw new Error('Enter a valid position first.');
  if (
    !stipulation.trim() ||
    /[\r\n]/.test(stipulation) ||
    stipulation.length > 120
  )
    throw new Error('Enter a stipulation on one line, for example #2 or h#2.');
  const board = parseFEN(fen);
  const conditioned = (isPopeye(fen) ? parsePopeye(fen) : null)?.commands.some(
    ({ keyword }) => keyword === 'condition'
  );
  if (!conditioned && isOrthodoxBoard(board))
    checkedPosition(
      board,
      `board ${/^(?:ser-)?h/i.test(stipulation.trim()) ? 'b' : 'w'} - - 0 1`
    );
  assertNativePieces(board);
  const doc = isPopeye(fen) ? parsePopeye(fen) : null;
  const originalStipulation = doc ? popeyeStipulation(doc.commands) : undefined;
  const commands = (doc?.commands ?? []).filter(
    ({ keyword }) => !['stipulation', 'sstipulation'].includes(keyword)
  );
  commands.push({
    keyword: originalStipulation?.keyword ?? 'stipulation',
    value: stipulation.trim()
  });
  // Ordinary FEN carries explicit castling/en-passant rights. Popeye files
  // already carry their own options, which must remain authoritative.
  commands.push(...popeyeFenOptions(fen));
  commands.push({
    keyword: 'option',
    value: `NoBoard MaxSolutions ${settings.solutions}${settings.variations ? ' Variation' : ''}${settings.threats ? '' : ' NoThreat'}`
  });
  return serializePopeye(board, {
    commands,
    fenMetadata: ''
  });
}

export function assertNativePieces(board: ChessBoard): void {
  for (const rank of board) {
    for (const cell of rank) {
      if (!cell || /^[KQRBNPkqrbnp]$/.test(cell) || parseNamedCell(cell))
        continue;
      const code = parseCellCode(cell);
      if (!code || code.rotation || !/^[KQRBNP]$/.test(code.type))
        throw new Error(
          'Use named fairy pieces for solving. Rotated symbols and markers do not define movement rules.'
        );
    }
  }
}

export function popeyeFenOptions(fen: string) {
  const commands: Array<{ keyword: string; value: string }> = [];
  if (isPopeye(fen)) return commands;
  const [, turn = 'w', castling = '-', ep = '-'] = fen.trim().split(/\s+/);
  const rooks = [
    ['K', 'h1'],
    ['Q', 'a1'],
    ['k', 'h8'],
    ['q', 'a8']
  ];
  const disabled = rooks.filter(([right]) => !castling.includes(right!));
  if (disabled.length)
    commands.push({
      keyword: 'option',
      value: `NoCastling ${disabled.map(([, square]) => square).join('')}`
    });
  if (/^[a-h][36]$/.test(ep)) {
    const file = ep[0];
    commands.push({
      keyword: 'option',
      value: `EnPassant ${file}${turn === 'b' ? '2' : '7'}${ep}${file}${turn === 'b' ? '4' : '5'}`
    });
  }
  return commands;
}
