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
