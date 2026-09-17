import { validateFEN } from '@chessviewer-org/chess-viewer';

import { getSessionId, invokeProtected } from './protectedFunctions';
import { verifyHuman } from './humanVerification';

// Types
export type DatabaseProvider = 'lichess' | 'chessdb';

export const PROVIDER_LABEL: Record<DatabaseProvider, string> = {
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

const PROVIDERS: readonly DatabaseProvider[] = ['lichess', 'chessdb'];

// Helpers
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

// Manual providers (login required — no automated search, link out only)
export type ManualDatabaseProvider = 'pdb' | 'yacpdb';

export const MANUAL_PROVIDER_LABEL: Record<ManualDatabaseProvider, string> = {
  pdb: 'PDB',
  yacpdb: 'YACPDB'
};

export const MANUAL_PROVIDER_HOME_URL: Record<ManualDatabaseProvider, string> =
  {
    pdb: 'https://pdb.dieschwalbe.de/',
    yacpdb: 'https://www.yacpdb.org/'
  };

const PDB_PIECE: Record<string, string> = {
  K: 'K',
  Q: 'D',
  R: 'T',
  B: 'L',
  N: 'S',
  P: 'B'
};
const YAC_TEXT_FIELDS = 14;
const YAC_CHECKBOX_DEFAULTS = ['1', '1', '1', '0'];

interface BoardPiece {
  piece: string;
  white: boolean;
  square: string;
}

function parseBoardPieces(fen: string): BoardPiece[] {
  const board = fen.trim().split(' ')[0] ?? '';
  const pieces: BoardPiece[] = [];
  board.split('/').forEach((row, rankIndex) => {
    let file = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        file += Number(ch);
        continue;
      }
      pieces.push({
        piece: ch.toUpperCase(),
        white: ch === ch.toUpperCase(),
        square: `${'abcdefgh'[file]}${8 - rankIndex}`
      });
      file += 1;
    }
  });
  return pieces;
}

function yacBase64(value: string): string {
  const utf8 = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of utf8) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\//g, '*');
}

export function buildPdbUrl(fen: string): string {
  const tokens = parseBoardPieces(fen).map(
    (p) => `${p.white ? 'w' : 's'}${PDB_PIECE[p.piece] ?? '?'}${p.square}`
  );
  const expression = `POSITION='${tokens.join(' ')}'`;
  return `https://pdb.dieschwalbe.de/search.jsp?expression=${encodeURIComponent(expression)}`;
}

export function buildYacpdbUrl(fen: string): string {
  const board = fen.trim().split(' ')[0] ?? '';
  const parts: string[] = new Array(YAC_TEXT_FIELDS).fill('') as string[];
  parts[0] = board;
  const joined = [...parts, ...YAC_CHECKBOX_DEFAULTS]
    .map((p) => p.replace(/\\/g, '\\\\').replace(/\//g, '\\/'))
    .join('/');
  return `https://www.yacpdb.org/#search/${yacBase64(joined)}/1`;
}

export function buildManualDatabaseUrl(
  provider: ManualDatabaseProvider,
  fen: string
): string {
  return provider === 'pdb' ? buildPdbUrl(fen) : buildYacpdbUrl(fen);
}

function notFound(fen: string): DatabaseSearchResult {
  return {
    lichess: { found: false, url: buildLichessUrl(fen) },
    chessdb: { found: false, url: buildChessdbUrl(fen) }
  };
}

function needsVerification(
  error: { status?: number; message: string } | null
): boolean {
  return error?.status === 403 && error.message === 'verification_required';
}

function callSearch(fen: string) {
  return invokeProtected<EdgeSearchResponse>('chess-database-search', {
    fen,
    sessionId: getSessionId()
  });
}

// Service
export async function searchPositionDatabases(
  fen: string,
  signal?: AbortSignal
): Promise<DatabaseSearchResult> {
  if (!fen || !validateFEN(fen)) return notFound(fen);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  try {
    let res = await callSearch(fen);

    if (needsVerification(res.error)) {
      const verified = await verifyHuman();
      if (verified) res = await callSearch(fen);
    }

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
