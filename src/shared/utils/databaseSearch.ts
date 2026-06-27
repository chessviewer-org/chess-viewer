import { supabase } from '@/features/auth/services/supabaseClient';

import { validateFEN } from './fenParser';
import { logger } from './logger';

/**
 * Chess-problem database integration (PDB + YACPDB).
 *
 * The actual lookup runs server-side in the `chess-database-search` Supabase
 * Edge Function (which bypasses browser CORS, caches results in Postgres, and
 * rate-limits the external sites). This module is the thin client seam: it
 * invokes that function and maps its PER-PROVIDER result map straight to the
 * shape the toolbar UI consumes.
 *
 * Edge function response (provider-aware — issue #158):
 *   { lichess:{found,url}, chessdb:{found,url}, pdb:{found,url}, yacpdb:{found,url} }
 * Client shape (identical):
 *   { lichess:{found,url}, chessdb:{found,url}, pdb:{found,url}, yacpdb:{found,url} }
 * Each provider is resolved independently server-side, so every row reflects its
 * OWN database — no first-hit-wins shadowing — and always carries a valid human
 * search `url` for manual link-out even on a miss.
 */

export type DatabaseProvider = 'pdb' | 'yacpdb' | 'lichess' | 'chessdb';

/** Human-facing display label for each provider (used in toasts / status pill). */
export const PROVIDER_LABEL: Record<DatabaseProvider, string> = {
  pdb: 'PDB',
  yacpdb: 'YACPDB',
  lichess: 'Lichess',
  chessdb: 'ChessDB'
};

/** Result for a single database provider. */
interface DatabaseHit {
  /** True only when the position is confirmed present in this database. */
  found: boolean;
  /** Human-facing search URL for the position (used for open-in-new-tab). */
  url: string;
}

/** Combined result for all supported providers. */
export type DatabaseSearchResult = Record<DatabaseProvider, DatabaseHit>;

/** One provider entry in the edge function's per-provider response map. */
interface EdgeProviderHit {
  found: boolean;
  url: string;
}

/** Per-provider response returned by the edge function (issue #158). */
type EdgeSearchResponse = Record<DatabaseProvider, EdgeProviderHit>;

const PROVIDERS: readonly DatabaseProvider[] = [
  'lichess',
  'chessdb',
  'pdb',
  'yacpdb'
];

/** Runtime guard for a single provider entry. */
function isEdgeProviderHit(value: unknown): value is EdgeProviderHit {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v['found'] === 'boolean' && typeof v['url'] === 'string';
}

/**
 * Runtime guard for the edge response. The payload crosses a trust boundary
 * (network → client), so we verify its shape before reading fields off it; a
 * malformed body degrades to a clean miss rather than risking a bad render.
 * Every provider key must be present and well-formed.
 */
function isEdgeSearchResponse(value: unknown): value is EdgeSearchResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return PROVIDERS.every((p) => isEdgeProviderHit(v[p]));
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
 * Lichess keys on the FULL FEN, so we pass it whole.
 *
 * Uses Lichess's PATH form `/analysis/standard/<fen>` (spaces → `_`, the FEN's
 * `/` kept as path separators) — NOT `?fen=`. The query form returns 200 but the
 * analysis SPA does not reliably hydrate from it, so it silently shows the START
 * position; the path form opens the actual position. (issue #158)
 */
function buildLichessUrl(fen: string): string {
  // Spaces are the only FEN char that must become `_`; encode the rest per
  // segment while preserving the `/` rank separators in the path.
  const path = fen
    .trim()
    .split(' ')
    .map((seg) => seg.split('/').map(encodeURIComponent).join('/'))
    .join('_');
  return `https://lichess.org/analysis/standard/${path}`;
}

/**
 * Human-facing ChessDB.cn URL for a position. ChessDB is an open, free cloud
 * engine-evaluation database keyed on the FULL FEN; its public query page is
 * `queryc_en/?<FEN>` in ITS OWN scheme: spaces become `_`, the `/` rank
 * separators are kept LITERAL, and the value is NOT percent-encoded. Encoding
 * the `/` to %2F breaks the page's parser and it silently loads the START
 * position instead (issue #158).
 */
function buildChessdbUrl(fen: string): string {
  return `https://www.chessdb.cn/queryc_en/?${fen.trim().replace(/ /g, '_')}`;
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
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    logger.warn('Database search invoke failed', err);
    return notFound(fen);
  }

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // Map each provider straight from its own key. Locally-built link-out URLs are
  // the fallback so a row is never left without a URL. Server URLs land in an
  // <a href>, so only https:// is trusted (reject javascript:/data: before the
  // DOM) — even though the edge function builds them from validated data.
  const base = notFound(fen);
  const result = { ...base };
  for (const p of PROVIDERS) {
    const hit = data[p];
    const trusted = hit.url.startsWith('https://') ? hit.url : '';
    result[p] = { found: hit.found, url: trusted || base[p].url };
  }
  return result;
}
