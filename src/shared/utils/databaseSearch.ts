import { supabase } from '@/auth';

import { validateFEN } from '@chessviewer-org/chess-viewer';

export type DatabaseProvider = 'pdb' | 'yacpdb' | 'lichess' | 'chessdb';

export const PROVIDER_LABEL: Record<DatabaseProvider, string> = {
  pdb: 'PDB',
  yacpdb: 'YACPDB',
  lichess: 'Lichess',
  chessdb: 'ChessDB'
};

interface DatabaseHit {
  found: boolean;
  url: string;
}

export type DatabaseSearchResult = Record<DatabaseProvider, DatabaseHit>;

interface EdgeProviderHit {
  found: boolean;
  url: string;
}

type EdgeSearchResponse = Record<DatabaseProvider, EdgeProviderHit>;

const PROVIDERS: readonly DatabaseProvider[] = [
  'lichess',
  'chessdb',
  'pdb',
  'yacpdb'
];

function isEdgeProviderHit(value: unknown): value is EdgeProviderHit {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['found'] === 'boolean' && typeof v['url'] === 'string';
}

function isEdgeSearchResponse(value: unknown): value is EdgeSearchResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return PROVIDERS.every((p) => isEdgeProviderHit(v[p]));
}

function boardField(fen: string): string {
  return fen.trim().split(/\s+/)[0] ?? '';
}

const PDB_PIECE_DE: Record<string, string> = {
  K: 'K',
  Q: 'D',
  R: 'T',
  B: 'L',
  N: 'S',
  P: 'B'
};

const FILES = 'abcdefgh';
const YAC_TEXT_FIELDS = 14;
const YAC_CHECKBOX_DEFAULTS = ['0', '0', '0', '0'];

function yacEscapeAndJoin(parts: string[]): string {
  return parts
    .map((p) => p.replace(/\\/g, '\\\\').replace(/\//g, '\\/'))
    .join('/');
}

function yacB64(s: string): string {
  const bytes = unescape(encodeURIComponent(s));
  return btoa(bytes).replace(/\//g, '*');
}

function pieceTokens(
  fen: string,
  colorFor: (white: boolean) => string,
  letterFor: Record<string, string>
): string[] {
  const tokens: string[] = [];
  const ranks = boardField(fen).split('/');

  for (let ri = 0; ri < ranks.length; ri++) {
    const rankStr = ranks[ri] ?? '';
    const rankNum = 8 - ri;
    let fileIdx = 0;

    for (const ch of rankStr) {
      if (ch >= '1' && ch <= '8') {
        fileIdx += Number(ch);
        continue;
      }
      const isWhite = ch === ch.toUpperCase();
      const type = letterFor[ch.toUpperCase()] ?? '?';
      const file = FILES[fileIdx] ?? '?';
      tokens.push(`${colorFor(isWhite)}${type}${file}${rankNum}`);
      fileIdx++;
    }
  }
  return tokens;
}

function buildPdbUrl(fen: string): string {
  const tokens = pieceTokens(fen, (w) => (w ? 'w' : 's'), PDB_PIECE_DE);
  const query = encodeURIComponent(`POSITION='${tokens.join(' ')}'`);
  return `https://pdb.dieschwalbe.de/search.jsp?expression=${query}`;
}

function buildYacpdbUrl(fen: string): string {
  const parts = new Array<string>(YAC_TEXT_FIELDS).fill('');
  parts[0] = boardField(fen);
  const encoded = yacB64(
    yacEscapeAndJoin([...parts, ...YAC_CHECKBOX_DEFAULTS])
  );
  return `https://www.yacpdb.org/#search/${encoded}/1`;
}

function buildLichessUrl(fen: string): string {
  const path = fen
    .trim()
    .split(' ')
    .map((seg) => seg.split('/').map(encodeURIComponent).join('/'))
    .join('_');
  return `https://lichess.org/analysis/standard/${path}`;
}

function buildChessdbUrl(fen: string): string {
  const query = fen.trim().replace(/ /g, '_');
  return `https://www.chessdb.cn/queryc_en/?${query}`;
}

function notFound(fen: string): DatabaseSearchResult {
  return {
    lichess: { found: false, url: buildLichessUrl(fen) },
    chessdb: { found: false, url: buildChessdbUrl(fen) },
    pdb: { found: false, url: buildPdbUrl(fen) },
    yacpdb: { found: false, url: buildYacpdbUrl(fen) }
  };
}

export async function searchPositionDatabases(
  fen: string,
  signal?: AbortSignal
): Promise<DatabaseSearchResult> {
  if (!fen || !validateFEN(fen)) return notFound(fen);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  try {
    const res = await supabase.functions.invoke<EdgeSearchResponse>(
      'chess-database-search',
      { body: { fen } }
    );

    if (res.error || !isEdgeSearchResponse(res.data)) {
      return notFound(fen);
    }

    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const result = notFound(fen);
    for (const p of PROVIDERS) {
      const hit = res.data[p];
      if (hit.url.startsWith('https://')) {
        result[p] = { found: hit.found, url: hit.url };
      }
    }
    return result;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    return notFound(fen);
  }
}
