import type { PlacedPiece, SearchResponse } from '../types.ts';
import { fetchText } from '../utils/fetch.ts';
import { logDrift, trace } from '../utils/trace.ts';

// Constants
const PDB_PIECE: Record<string, string> = {
  K: 'K',
  Q: 'D',
  R: 'T',
  B: 'L',
  N: 'S',
  P: 'B'
};

// Helpers
function buildExpression(pieces: PlacedPiece[]): string {
  const tokens = pieces.map(
    (p) => `${p.white ? 'w' : 's'}${PDB_PIECE[p.piece] ?? '?'}${p.square}`
  );
  return `POSITION='${tokens.join(' ')}'`;
}

export function pdbUrl(pieces: PlacedPiece[]): string {
  return `https://pdb.dieschwalbe.de/search.jsp?expression=${encodeURIComponent(buildExpression(pieces))}`;
}

// Search
export async function searchPdb(
  pieces: PlacedPiece[]
): Promise<SearchResponse> {
  const url = pdbUrl(pieces);
  const miss: SearchResponse = { found: false, database: 'PDB', url };
  trace('PDB', 'expression', buildExpression(pieces));
  try {
    const html = await fetchText(url);
    if (html === null) return miss;
    if (/the search command is not correct/i.test(html)) {
      logDrift('PDB', url, html);
      return miss;
    }
    if (/no problems? (have|has) been found/i.test(html)) return miss;
    const m = html.match(/(\d+)\s+problem\(?s?\)?\s+found/i);
    if (!m) {
      logDrift('PDB', url, html);
      return miss;
    }
    const count = parseInt(m[1] ?? '0', 10);
    trace('PDB', 'count', count);
    return count > 0 ? { found: true, database: 'PDB', url } : miss;
  } catch (err) {
    console.error('PDB error:', err);
    return miss;
  }
}
