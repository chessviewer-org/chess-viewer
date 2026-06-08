import { supabase } from '@/features/auth/services/supabaseClient';

import { validateFEN } from './fenParser';
import { logger } from './logger';

/**
 * Chess-problem database integration (PDB + YACPDB).
 *
 * The actual lookup runs server-side in the `chess-database-search` Supabase
 * Edge Function (which bypasses browser CORS, caches results in Postgres, and
 * rate-limits the external sites). This module is the thin client seam: it
 * invokes that function and maps its UNIFIED result to the per-provider shape
 * the toolbar UI consumes.
 *
 * Edge function response:  { found, database: 'PDB'|'YACPDB'|null, url|null }
 * Client shape (per icon):  { pdb: {found,url}, yacpdb: {found,url} }
 * Only the provider whose `database` matches lights up; the other stays muted
 * but still carries a valid human search `url` for manual link-out.
 */

export type DatabaseProvider = 'pdb' | 'yacpdb' | 'lichess' | 'chessdb';

/** Human-facing display label for each provider (used in toasts / status pill). */
export const PROVIDER_LABEL: Record<DatabaseProvider, string> = {
  pdb: 'PDB',
  yacpdb: 'YACPDB',
  lichess: 'Lichess',
  chessdb: 'ChessDB'
};

/**
 * The provider a result matched in, or null for a clean miss. Lets the UI fire
 * the correct "Found in X" toast / status without re-deriving it from the map.
 */
export function matchedProvider(
  result: DatabaseSearchResult | null
): DatabaseProvider | null {
  if (!result) return null;
  if (result.lichess.found) return 'lichess';
  if (result.chessdb.found) return 'chessdb';
  if (result.pdb.found) return 'pdb';
  if (result.yacpdb.found) return 'yacpdb';
  return null;
}

/** Result for a single database provider. */
export interface DatabaseHit {
  /** True only when the position is confirmed present in this database. */
  found: boolean;
  /** Human-facing search URL for the position (used for open-in-new-tab). */
  url: string;
}

/** Combined result for all supported providers. */
export type DatabaseSearchResult = Record<DatabaseProvider, DatabaseHit>;

/** Unified response returned by the edge function. */
interface EdgeSearchResponse {
  found: boolean;
  database: string | null;
  url: string | null;
}

/**
 * Runtime guard for the edge response. The payload crosses a trust boundary
 * (network → client), so we verify its shape before reading fields off it; a
 * malformed body degrades to a clean miss rather than risking a bad render.
 */
function isEdgeSearchResponse(value: unknown): value is EdgeSearchResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['found'] === 'boolean' &&
    (v['database'] === null || typeof v['database'] === 'string') &&
    (v['url'] === null || typeof v['url'] === 'string')
  );
}

/** Just the board-placement field of a FEN (what these DBs key on). */
function boardField(fen: string): string {
  return fen.trim().split(/\s+/)[0] ?? '';
}

/**
 * Decompose a FEN board field into upstream piece tokens. Mirrors the edge
 * function's grammar so the human link-out opens the SAME query the proxy ran.
 * PDB uses German color/piece letters (w/s · K D T L S B); YACPDB uses English
 * with w/b color and S for the knight.
 */
const PDB_PIECE_DE: Record<string, string> = {
  K: 'K',
  Q: 'D',
  R: 'T',
  B: 'L',
  N: 'S',
  P: 'B'
};
const FILES = 'abcdefgh';

// --- YACPDB deep-link encoding (decoded from their app JS) -------------------
// The website's search route is `#search/<b64>/<page>`, where <b64> is the
// search FORM serialized — NOT a raw Matrix query (passing that loads an empty
// board). The form is 14 text fields + 4 checkboxes, escape-joined by "/", then
// base64'd with "/"→"*". Field 0 is "fen", so we drop the board FEN there and
// leave the rest empty; YACPDB converts it to a position search itself.
const YAC_TEXT_FIELDS = 14; // fen, author, source, … material_wo
const YAC_CHECKBOX_DEFAULTS = ['0', '0', '0', '0']; // transformsall,v,h,material

/** Escape "\" and "/" in each part, then join with "/" (mirror of the site). */
function yacEscapeAndJoin(parts: string[]): string {
  return parts
    .map((p) => p.replace(/\\/g, '\\\\').replace(/\//g, '\\/'))
    .join('/');
}

/** btoa over UTF-8 bytes, with "/"→"*" (the site's B64_enc). */
function yacB64(s: string): string {
  // encodeURIComponent→unescape yields a Latin1 byte string btoa can encode,
  // matching the site's `btoa(unescape(encodeURIComponent(s)))` exactly.
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
        fileIdx += ch.charCodeAt(0) - 48;
        continue;
      }
      const white = ch === ch.toUpperCase();
      const type = letterFor[ch.toUpperCase()] ?? '?';
      tokens.push(
        `${colorFor(white)}${type}${FILES[fileIdx] ?? '?'}${rankNum}`
      );
      fileIdx++;
    }
  }
  return tokens;
}

/** Human-facing PDB search URL for a position (link-out + found result). */
function buildPdbUrl(fen: string): string {
  const tokens = pieceTokens(fen, (w) => (w ? 'w' : 's'), PDB_PIECE_DE);
  return `https://pdb.dieschwalbe.de/search.jsp?expression=${encodeURIComponent(
    `POSITION='${tokens.join(' ')}'`
  )}`;
}

/** Human-facing YACPDB search URL for a position (link-out + found result). */
function buildYacpdbUrl(fen: string): string {
  const parts = new Array<string>(YAC_TEXT_FIELDS).fill('');
  parts[0] = boardField(fen); // the "fen" form field
  const encoded = yacB64(
    yacEscapeAndJoin([...parts, ...YAC_CHECKBOX_DEFAULTS])
  );
  return `https://www.yacpdb.org/#search/${encoded}/1`;
}

/**
 * Human-facing Lichess URL for a position. Unlike PDB/YACPDB (board-field only),
 * Lichess keys on the FULL FEN, so we pass it whole. Opens the analysis board,
 * whose Opening Explorer panel lists the games that reached this position.
 */
function buildLichessUrl(fen: string): string {
  return `https://lichess.org/analysis?fen=${encodeURIComponent(fen.trim())}`;
}

/**
 * Human-facing ChessDB.cn URL for a position. ChessDB is an open, free cloud
 * engine-evaluation database keyed on the FULL FEN; its public query page is
 * `queryc_en/?<FEN>` with the FEN passed verbatim in the query string (their
 * own scheme — spaces preserved, encoded for safety).
 */
function buildChessdbUrl(fen: string): string {
  return `https://www.chessdb.cn/queryc_en/?${encodeURIComponent(fen.trim())}`;
}

function notFound(fen: string): DatabaseSearchResult {
  return {
    lichess: { found: false, url: buildLichessUrl(fen) },
    chessdb: { found: false, url: buildChessdbUrl(fen) },
    pdb: { found: false, url: buildPdbUrl(fen) },
    yacpdb: { found: false, url: buildYacpdbUrl(fen) }
  };
}

/**
 * Silent background lookup of a position via the edge proxy.
 *
 * @param fen    Current board FEN.
 * @param signal Optional AbortSignal; when it fires we discard the result so a
 *               stale lookup can never overwrite a newer one.
 * @returns Per-provider `{ found, url }`.
 */
export async function searchPositionDatabases(
  fen: string,
  signal?: AbortSignal
): Promise<DatabaseSearchResult> {
  // Guard: never search an invalid/partial position.
  if (!fen || !validateFEN(fen)) return notFound(fen);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  let data: EdgeSearchResponse | null = null;
  try {
    const res = await supabase.functions.invoke<EdgeSearchResponse>(
      'chess-database-search',
      { body: { fen } }
    );
    if (res.error) {
      logger.warn('Database search function error', res.error);
      return notFound(fen);
    }
    // Verify the payload shape before trusting it (network trust boundary).
    if (!isEdgeSearchResponse(res.data)) {
      logger.warn('Database search returned an unexpected payload', res.data);
      return notFound(fen);
    }
    data = res.data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    logger.warn('Database search invoke failed', err);
    return notFound(fen);
  }

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (!data.found || !data.database) return notFound(fen);

  // Light up only the matching provider; keep link-out URLs for the rest.
  const base = notFound(fen);
  // Only trust https:// link-outs — the value lands in an <a href>, so reject
  // any non-https scheme (javascript:/data:) before it can reach the DOM, even
  // though the edge function builds these URLs server-side from validated data.
  const matchedUrl = data.url?.startsWith('https://') ? data.url : '';
  if (data.database === 'LICHESS') {
    return {
      ...base,
      lichess: { found: true, url: matchedUrl || base.lichess.url }
    };
  }
  if (data.database === 'CHESSDB') {
    return {
      ...base,
      chessdb: { found: true, url: matchedUrl || base.chessdb.url }
    };
  }
  if (data.database === 'PDB') {
    return {
      ...base,
      pdb: { found: true, url: matchedUrl || base.pdb.url }
    };
  }
  if (data.database === 'YACPDB') {
    return {
      ...base,
      yacpdb: { found: true, url: matchedUrl || base.yacpdb.url }
    };
  }
  return base;
}
