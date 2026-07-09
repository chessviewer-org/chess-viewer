import type { PlacedPiece, SearchResponse } from '../types.ts';
import { fetchText } from '../utils/fetch.ts';
import { logDrift, trace } from '../utils/trace.ts';

// Constants
const YAC_PIECE: Record<string, string> = {
  K: 'K',
  Q: 'Q',
  R: 'R',
  B: 'B',
  N: 'N',
  P: 'P'
};
const YAC_TYPE_RE = /^([KQRBN])([a-h][1-8])$/;
const YAC_TEXT_FIELDS = 20;
const YAC_CHECKBOX_DEFAULTS = [
  '1',
  '1',
  '0',
  '0',
  '0',
  '0',
  '0',
  '0',
  '0',
  '0'
];

// Types
interface YacEntry {
  algebraic?: { white?: unknown; black?: unknown };
}

// Helpers
function pieceSet(pieces: PlacedPiece[]): Set<string> {
  return new Set(
    pieces.map(
      (p) => `${p.white ? 'w' : 'b'}${YAC_PIECE[p.piece] ?? '?'}${p.square}`
    )
  );
}

function entryPieceSet(entry: YacEntry): Set<string> {
  const out = new Set<string>();
  const add = (list: unknown, color: 'w' | 'b'): void => {
    if (!Array.isArray(list)) return;
    for (const tok of list) {
      if (typeof tok !== 'string') continue;
      const m = YAC_TYPE_RE.exec(tok);
      if (m) {
        out.add(`${color}${m[1]}${m[2]}`);
        continue;
      }
      if (/^[a-h][1-8]$/.test(tok)) out.add(`${color}P${tok}`);
    }
  };
  add(entry.algebraic?.white, 'w');
  add(entry.algebraic?.black, 'b');
  return out;
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function yacB64(s: string): string {
  const utf8 = new TextEncoder().encode(s);
  let bin = '';
  for (const b of utf8) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\//g, '*');
}

export function yacpdbHumanUrl(board: string): string {
  const parts: string[] = new Array(YAC_TEXT_FIELDS).fill('') as string[];
  parts[0] = board;
  const joined = [...parts, ...YAC_CHECKBOX_DEFAULTS]
    .map((p) => p.replace(/\\/g, '\\\\').replace(/\//g, '\\/'))
    .join('/');
  return `https://www.yacpdb.org/#search/${yacB64(joined)}/1`;
}

// Search
export async function searchYacpdb(
  pieces: PlacedPiece[],
  board: string
): Promise<SearchResponse> {
  const want = pieceSet(pieces);
  const query = `Matrix('${[...want].join(' ')}')`;
  const humanUrl = yacpdbHumanUrl(board);
  const miss: SearchResponse = {
    found: false,
    database: 'YACPDB',
    url: humanUrl
  };

  trace('YACPDB', 'query', query);
  try {
    const apiUrl = `https://www.yacpdb.org/gateway/ql?q=${encodeURIComponent(query)}`;
    const text = await fetchText(apiUrl, {
      headers: { Accept: 'application/json' }
    });
    if (text === null) return miss;

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      logDrift('YACPDB', apiUrl, text);
      return miss;
    }

    const d = data as {
      success?: boolean;
      result?: { entries?: unknown; count?: unknown };
    };
    if (d.success !== true) {
      logDrift('YACPDB', apiUrl, text);
      return miss;
    }

    const entries = d.result?.entries;
    if (!Array.isArray(entries)) return miss;

    trace('YACPDB', 'count', d.result?.count, 'entries', entries.length);
    for (const entry of entries) {
      if (sameSet(entryPieceSet(entry as YacEntry), want)) {
        return { found: true, database: 'YACPDB', url: humanUrl };
      }
    }
    return miss;
  } catch (err) {
    console.error('YACPDB error:', err);
    return miss;
  }
}
