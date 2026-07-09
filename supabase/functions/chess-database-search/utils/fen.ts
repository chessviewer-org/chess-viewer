import type { PlacedPiece } from '../types.ts';

// Constants
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

// Helpers
export function boardField(fen: string): string {
  return fen.trim().split(/\s+/)[0] ?? '';
}

export function isValidBoardField(board: string): boolean {
  if (!board || board.length > 100) return false;
  const ranks = board.split('/');
  if (ranks.length !== 8) return false;
  for (const rank of ranks) {
    if (!/^[pnbrqkPNBRQK1-8]+$/.test(rank)) return false;
    if (/\d\d/.test(rank)) return false;
    let squares = 0;
    for (const ch of rank) {
      squares += ch >= '1' && ch <= '8' ? ch.charCodeAt(0) - 48 : 1;
    }
    if (squares !== 8) return false;
  }
  return true;
}

export function parsePieces(board: string): PlacedPiece[] {
  const out: PlacedPiece[] = [];
  const ranks = board.split('/');
  for (let ri = 0; ri < ranks.length; ri++) {
    const rankNum = 8 - ri;
    let fileIdx = 0;
    for (const ch of ranks[ri] ?? '') {
      if (ch >= '1' && ch <= '8') {
        fileIdx += ch.charCodeAt(0) - 48;
        continue;
      }
      out.push({
        piece: ch.toUpperCase(),
        white: ch === ch.toUpperCase(),
        square: `${FILES[fileIdx] ?? '?'}${rankNum}`
      });
      fileIdx++;
    }
  }
  return out;
}
