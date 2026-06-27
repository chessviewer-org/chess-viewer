// Supabase Edge Function: chess-database-search
//
// Proxies position lookups to the PDB (pdb.dieschwalbe.de) and YACPDB
// (yacpdb.org) chess-problem databases, bypassing browser CORS limits.
//
// Pipeline:  client FEN  ->  Postgres cache check (PDB/YACPDB only)  ->  query
//            ALL FOUR providers independently (in parallel)  ->  cache write  ->
//            per-provider JSON map.
//
// Response shape (always 200 unless the request itself is malformed) — a
// per-provider map so the client lights up each row from its own key, with no
// first-hit-wins shadowing (issue #158):
//   { lichess:{found,url}, chessdb:{found,url}, pdb:{found,url}, yacpdb:{found,url} }
//
// Robustness: every external call is time-boxed AND retried with backoff on
// transient failure (timeout / 5xx / network). Only a *terminal* outcome (a
// clean 2xx body, or a 4xx the upstream owns) ends the loop; anything else is
// retried up to RETRY_ATTEMPTS times before degrading to a safe "not found".
// Layout drift (a missing parse marker) logs a truncated RAW response under the
// greppable [PARSER_DRIFT] tag so the parser can be fixed from
// `supabase functions logs` without reproducing locally. Negative results are
// cached briefly so a broken/slow upstream is not hammered.
//
// Deno runtime — this file is NOT part of the Vite/tsc/eslint pipeline.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.107.0';

interface SearchResponse {
  found: boolean;
  database: string | null;
  url: string | null;
}

// Per-provider result map — the protocol the client consumes (issue #158). Each
// provider is resolved INDEPENDENTLY and reported under its own key, so pressing
// one provider's Search button always reflects THAT provider (no first-hit-wins
// shadowing). `found` is the catalogued flag; `url` is the human link-out.
interface ProviderHit {
  found: boolean;
  url: string;
}
type Provider = 'lichess' | 'chessdb' | 'pdb' | 'yacpdb';
type ProviderMap = Record<Provider, ProviderHit>;

// CORS allow-list. `Allow-Headers` must cover every header the Supabase JS
// client attaches to an invoke (authorization, apikey, x-client-info, the JSON
// content-type, and the newer x-supabase-api-version) — a header the browser
// asks about in the preflight that is NOT listed here makes the preflight fail
// and the real request never fires. `Max-Age` lets the browser cache the
// preflight so it is not re-sent (and re-risked) on every keystroke search.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// How long a cached row stays authoritative before a re-check (ms).
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
// Negative ("not found") results expire faster so newly-added problems surface.
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day
// Per-attempt request timeout (ms). MEASURED upstream TTFB (re-measured 2026-06):
// PDB returns the START position in ~37s (server-side matrix search is genuinely
// slow — NOT bot-blocking; returns 200 regardless of User-Agent), YACPDB similar.
// 20s aborted PDB before it could answer, which made real hits read as "not
// found" (issue #158). 40s clears the measured worst case with headroom. All four
// providers run in PARALLEL, so this is the wall-clock ceiling, not a sum.
const FETCH_TIMEOUT_MS = 40000;
// Extra attempts after the first on a TRANSIENT failure (timeout/5xx/network).
// Kept at 1 (was 2): at a 20s budget per attempt, stacking retries would push a
// fully-failing lookup past sane edge-execution / client-wait limits. One retry
// covers a genuine transient blip without ballooning worst-case latency.
const RETRY_ATTEMPTS = 1;
// Backoff before each retry (ms); index 0 → before 1st retry, etc.
const RETRY_BACKOFF_MS = [600];
// Cap on how long a 429 Retry-After may make us wait before the single retry, so
// a hostile/huge value can't stall the edge invocation past its execution budget.
const RETRY_AFTER_CAP_MS = 5000;
// How much raw upstream body to echo into logs on parser drift (chars).
const DRIFT_LOG_CHARS = 2000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

/** Board-placement field only — the key both databases match on. */
function boardField(fen: string): string {
  return fen.trim().split(/\s+/)[0] ?? '';
}

/**
 * Strict FEN board-field validation — the upstream gate.
 *
 * Beyond a character whitelist this enforces structural integrity so malformed
 * positions never reach (and never burden / error out) PDB or YACPDB:
 *   - exactly 8 ranks,
 *   - each rank resolves to EXACTLY 8 squares (piece chars + empty-run digits),
 *   - no consecutive digits (e.g. "44" must be written "8"),
 *   - bounded length.
 * A position passing this is guaranteed to be a syntactically sound 8×8 board.
 */
function isValidBoardField(board: string): boolean {
  if (!board || board.length > 100) return false;
  const ranks = board.split('/');
  if (ranks.length !== 8) return false;
  for (const rank of ranks) {
    if (!/^[pnbrqkPNBRQK1-8]+$/.test(rank)) return false;
    if (/\d\d/.test(rank)) return false; // consecutive digits are non-canonical
    let squares = 0;
    for (const ch of rank) {
      squares += ch >= '1' && ch <= '8' ? ch.charCodeAt(0) - 48 : 1;
    }
    if (squares !== 8) return false;
  }
  return true;
}

/** One placed piece, decomposed from the FEN board field. */
interface PlacedPiece {
  /** Uppercase English piece letter: K Q R B N P. */
  piece: string;
  /** true = white (uppercase in FEN), false = black. */
  white: boolean;
  /** Algebraic square, e.g. "e1". */
  square: string;
}

const FILES = 'abcdefgh';

/**
 * Decompose a validated FEN board field into placed pieces. Rank 0 of the FEN
 * string is rank 8 of the board (FEN lists ranks 8→1, files a→h).
 */
function parsePieces(board: string): PlacedPiece[] {
  const out: PlacedPiece[] = [];
  const ranks = board.split('/');
  for (let ri = 0; ri < ranks.length; ri++) {
    const rankStr = ranks[ri] ?? '';
    const rankNum = 8 - ri;
    let fileIdx = 0;
    for (const ch of rankStr) {
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

/**
 * Outcome of a single fetch attempt.
 *  - `ok`        : 2xx body retrieved — terminal success.
 *  - `terminal`  : the upstream answered with a 4xx it owns — do NOT retry
 *                  (retrying a client-side rejection just wastes the budget).
 *  - `transient` : timeout / 5xx / network / 429 — safe to retry. `retryAfterMs`
 *                  carries the upstream's `Retry-After` (429) when present so we
 *                  back off for at least as long as it asked.
 */
type FetchAttempt =
  | { kind: 'ok'; text: string }
  | { kind: 'terminal' }
  | { kind: 'transient'; retryAfterMs?: number };

/** Parse a `Retry-After` header (delta-seconds or HTTP-date) into ms. */
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const secs = Number(value);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const when = Date.parse(value);
  if (Number.isFinite(when)) return Math.max(0, when - Date.now());
  return undefined;
}

/** One time-boxed fetch attempt, classified for the retry loop. */
async function fetchOnce(
  url: string,
  init?: RequestInit
): Promise<FetchAttempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      // Realistic browser headers. NOTE: measurement showed both upstreams
      // return 200 with a bare UA too — they are slow, not bot-blocking — so
      // these are belt-and-suspenders (future-proofing against light filtering)
      // rather than the timeout fix. Per-call init.headers still win.
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(init?.headers ?? {})
      }
    });
    if (res.ok) return { kind: 'ok', text: await res.text() };
    // 429 → rate-limited: transient, but honour Retry-After so we don't hammer
    // the upstream (Lichess explorer in particular shares an IP across all our
    // users). 5xx → transient (upstream hiccup); other 4xx → terminal.
    if (res.status === 429) {
      const retryAfterMs = parseRetryAfter(res.headers.get('Retry-After'));
      console.error(
        `Upstream ${url} returned 429 (rate-limited) retryAfterMs=${retryAfterMs ?? 'n/a'}`
      );
      return retryAfterMs !== undefined
        ? { kind: 'transient', retryAfterMs }
        : { kind: 'transient' };
    }
    if (res.status >= 500) {
      console.error(`Upstream ${url} returned ${res.status} (retryable)`);
      return { kind: 'transient' };
    }
    console.error(`Upstream ${url} returned ${res.status} (terminal)`);
    return { kind: 'terminal' };
  } catch (err) {
    // Abort (timeout) and network errors are both transient.
    console.error(`Upstream ${url} attempt failed (retryable):`, err);
    return { kind: 'transient' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch with a hard per-attempt timeout AND backoff retry on transient failure.
 * Returns the body text, or null once the position is a terminal miss or the
 * retry budget is exhausted.
 */
async function fetchText(
  url: string,
  init?: RequestInit
): Promise<string | null> {
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    const outcome = await fetchOnce(url, init);
    if (outcome.kind === 'ok') return outcome.text;
    if (outcome.kind === 'terminal') return null;
    // transient: back off and retry unless the budget is spent. A 429 carries
    // the upstream's Retry-After — wait AT LEAST that long (capped so one nasty
    // value can't stall the whole edge invocation past its budget).
    if (attempt < RETRY_ATTEMPTS) {
      const base = RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS.at(-1) ?? 500;
      const wait =
        outcome.retryAfterMs !== undefined
          ? Math.min(Math.max(outcome.retryAfterMs, base), RETRY_AFTER_CAP_MS)
          : base;
      await sleep(wait);
    }
  }
  console.error(`Upstream ${url} exhausted ${RETRY_ATTEMPTS + 1} attempts`);
  return null;
}

// Verbose tracing toggle. Set the `DB_SEARCH_DEBUG` function secret to "1"
// (`supabase secrets set DB_SEARCH_DEBUG=1`) to stream the full decision trail
// — want set, query string, raw lengths, per-entry piece sets, cache hits — to
// `supabase functions logs`. Leave unset in steady state to keep logs quiet;
// drift/error logs always fire regardless.
const DEBUG = (Deno.env.get('DB_SEARCH_DEBUG') ?? '') === '1';

/** Structured, greppable trace line (no-op unless DB_SEARCH_DEBUG=1). */
function TRACE(scope: string, ...parts: unknown[]): void {
  if (!DEBUG) return;
  const rendered = parts
    .map((p) =>
      typeof p === 'string' || typeof p === 'number' || typeof p === 'boolean'
        ? String(p)
        : JSON.stringify(p)
    )
    .join(' ');
  console.log(`[DBSEARCH:${scope}] ${rendered}`);
}

/**
 * Log a parser-drift event with a truncated RAW upstream body so the layout
 * change can be diagnosed straight from `supabase functions logs`. The
 * [PARSER_DRIFT] tag is stable + greppable; the body is clipped to
 * DRIFT_LOG_CHARS so a large page can't flood the log stream.
 */
function logDrift(provider: string, url: string, raw: string): void {
  const snippet = raw.slice(0, DRIFT_LOG_CHARS);
  const truncated = raw.length > DRIFT_LOG_CHARS ? ' …[truncated]' : '';
  console.error(
    `[PARSER_DRIFT] ${provider} marker missing — layout change? url=${url} ` +
      `len=${raw.length}\n----- RAW START -----\n${snippet}${truncated}\n----- RAW END -----`
  );
}

/** PDB lookup. Isolated try/catch — a parse break here never affects YACPDB. */
// PDB query grammar (decoded from the live server, NOT a public FEN endpoint):
//   * field is POSITION='<piece> <piece> …'
//   * each piece is 4 chars: <color><type><file><rank>
//   * color letters are GERMAN: w = white, s = schwarz (black) — NOT 'b'
//   * piece letters are GERMAN: K, D(ame=Q), T(urm=R), L(äufer=B), S(pringer=N),
//     B(auer=P)
// e.g. white Ke1 + black Ke8 + white Qd1  →  POSITION='wKe1 sKe8 wDd1'
const PDB_PIECE_DE: Record<string, string> = {
  K: 'K',
  Q: 'D',
  R: 'T',
  B: 'L',
  N: 'S',
  P: 'B'
};

/** Build PDB's POSITION expression from the placed pieces. */
function buildPdbExpression(pieces: PlacedPiece[]): string {
  const tokens = pieces.map(
    (p) => `${p.white ? 'w' : 's'}${PDB_PIECE_DE[p.piece] ?? '?'}${p.square}`
  );
  return `POSITION='${tokens.join(' ')}'`;
}

/** Human-facing PDB results URL for a position (used for the found link-out). */
function pdbUrl(pieces: PlacedPiece[]): string {
  return `https://pdb.dieschwalbe.de/search.jsp?expression=${encodeURIComponent(
    buildPdbExpression(pieces)
  )}`;
}

async function searchPdb(pieces: PlacedPiece[]): Promise<SearchResponse> {
  const expression = buildPdbExpression(pieces);
  const url = pdbUrl(pieces);
  // Every return carries the human URL so a miss still link-outs to PDB.
  const miss: SearchResponse = { found: false, database: 'PDB', url };
  TRACE('PDB', 'expression', expression);
  try {
    const html = await fetchText(url);
    if (html === null) {
      TRACE('PDB', 'fetch', 'null (timeout/exhausted) → NOT_FOUND');
      return miss;
    }
    TRACE('PDB', 'rawLen', html.length);
    // A rejected query renders an error <section> instead of a result count;
    // surface it as drift (our expression grammar would be at fault).
    if (/the search command is not correct/i.test(html)) {
      TRACE('PDB', 'rejected', 'search command not correct — logging drift');
      logDrift('PDB', url, html);
      return miss;
    }
    // Explicit empty result — a clean miss, NOT a layout change. Recognising it
    // keeps the drift log quiet for the common no-hit case.
    if (/no problems? (have|has) been found/i.test(html)) {
      TRACE('PDB', 'result', 'explicit "no problems found" → NOT_FOUND');
      return miss;
    }
    // PDB prints "N problem(s) found"; any non-zero count is a hit. A missing
    // marker on an otherwise-OK page means the layout changed → log + degrade.
    const m = html.match(/(\d+)\s+problem\(?s?\)?\s+found/i);
    if (!m) {
      TRACE('PDB', 'marker', 'absent — logging drift');
      logDrift('PDB', url, html);
      return miss;
    }
    const count = parseInt(m[1] ?? '0', 10);
    TRACE('PDB', 'count', count);
    return count > 0 ? { found: true, database: 'PDB', url } : miss;
  } catch (err) {
    console.error('PDB parse error:', err);
    return miss;
  }
}

// YACPDB query grammar (decoded from the live gateway/ql endpoint):
//   * the ONLY position predicate is Matrix('<piecelist>') — there is no
//     'MatrixExtended'/'Fen'/'Position' predicate (those 404 as unknown).
//   * a piece token is <color><type><square>: color w|b, type in English
//     letters K Q R B S(knight) P, e.g. "wKe1 bKe8".
//   * Matrix is an AND-SUPERSET match (problems CONTAINING all listed pieces),
//     so a raw query can over-report. We post-filter the returned entries for
//     an EXACT piece-set match to answer "is THIS diagram catalogued?".
//   * success shape: { success: true, result: { entries: [...], count: N } }
//     where each entry has algebraic: { white: [...], black: [...] }.
const YAC_PIECE: Record<string, string> = {
  K: 'K',
  Q: 'Q',
  R: 'R',
  B: 'B',
  N: 'S',
  P: 'P'
};

/** Canonical "<w|b><type><square>" token set for an exact-position compare. */
function yacPieceSet(pieces: PlacedPiece[]): Set<string> {
  return new Set(
    pieces.map(
      (p) => `${p.white ? 'w' : 'b'}${YAC_PIECE[p.piece] ?? '?'}${p.square}`
    )
  );
}

interface YacEntry {
  algebraic?: { white?: unknown; black?: unknown };
}

// A YACPDB algebraic token is either "<TYPE><square>" with TYPE in K Q R B S P
// (yes, pawns are written WITH a leading 'P', e.g. "Pa2"), or — defensively —
// a bare "<square>" pawn. The previous regex [KQRBSN] OMITTED 'P', so every
// pawn token "Pa2" was misparsed as type 'P' + square "Pa2" → "wPPa2", which
// could never equal the want-side "wPa2". That silently broke EXACT matching
// for ANY position containing a pawn. 'P' is now included.
const YAC_TYPE_RE = /^([KQRBSNP])([a-h][1-8])$/;

/** Re-derive a token set from one entry's algebraic piece lists. */
function entryPieceSet(entry: YacEntry): Set<string> {
  const out = new Set<string>();
  const add = (list: unknown, color: 'w' | 'b'): void => {
    if (!Array.isArray(list)) return;
    for (const tok of list) {
      if (typeof tok !== 'string') continue;
      const m = YAC_TYPE_RE.exec(tok);
      if (m) {
        // Normal "<TYPE><square>" token.
        out.add(`${color}${m[1]}${m[2]}`);
        continue;
      }
      // Fallback: a bare "<square>" is a pawn.
      if (/^[a-h][1-8]$/.test(tok)) {
        out.add(`${color}P${tok}`);
      }
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

// YACPDB website deep-link (decoded from their app JS). The route is
// `#search/<b64>/<page>` where <b64> is the search FORM (14 text fields + 4
// checkboxes) escape-joined by "/" then base64'd with "/"→"*". Field 0 is the
// "fen" field — passing a raw Matrix query instead loads an EMPTY board. Build
// the form-shaped link so a click opens the actual problem.
const YAC_TEXT_FIELDS = 14;
const YAC_CHECKBOX_DEFAULTS = ['0', '0', '0', '0'];

function yacB64(s: string): string {
  // Mirror the site's btoa(unescape(encodeURIComponent(s))). Deno lacks
  // `unescape`, so encode UTF-8 → Latin1 byte string manually.
  const utf8 = new TextEncoder().encode(s);
  let bin = '';
  for (const b of utf8) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\//g, '*');
}

function yacpdbHumanUrl(board: string): string {
  const parts: string[] = new Array(YAC_TEXT_FIELDS).fill('');
  parts[0] = board; // the "fen" form field
  const joined = [...parts, ...YAC_CHECKBOX_DEFAULTS]
    .map((p) => p.replace(/\\/g, '\\\\').replace(/\//g, '\\/'))
    .join('/');
  return `https://www.yacpdb.org/#search/${yacB64(joined)}/1`;
}

// Lichess Opening Explorer (explorer.lichess.ovh) — the ONLY of the three with
// a real position→games API (no key, CC0). Unlike PDB/YACPDB it keys on the
// FULL FEN (side-to-move + castling + en-passant change the result), so it
// receives `fen`, not the bare board field. Two free endpoints are queried:
//   * /masters  — OTB master/tournament games ("who played this?")
//   * /lichess  — online lichess.org games (broader position coverage)
// Each returns aggregate { white, draws, black }; any positive sum means the
// position has been reached in at least one indexed game → catalogued. We only
// need existence, so games/moves are suppressed (topGames=0&moves=0) to keep
// the payload tiny and the lookup fast.
interface LichessExplorerResponse {
  white?: unknown;
  draws?: unknown;
  black?: unknown;
}

/** Coerce an unknown count field to a non-negative integer (0 on garbage). */
function asCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

/** True when the explorer payload reports ≥1 game reaching this position. */
function lichessHasGames(text: string): boolean {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return false;
  }
  if (typeof data !== 'object' || data === null) return false;
  const d = data as LichessExplorerResponse;
  return asCount(d.white) + asCount(d.draws) + asCount(d.black) > 0;
}

/**
 * Human-facing Lichess link for a position. Opens the analysis board (whose
 * Opening Explorer panel lists the games that reached this position); keys on
 * the FULL FEN like the API does. Used for the found link-out.
 *
 * Uses the PATH form `/analysis/standard/<fen>` (spaces → `_`, FEN `/` kept as
 * path separators), NOT `?fen=` — the query form returns 200 but the analysis
 * SPA silently shows the START position instead of hydrating from it (issue #158).
 */
function lichessHumanUrl(fen: string): string {
  const path = fen
    .trim()
    .split(' ')
    .map((seg) => seg.split('/').map(encodeURIComponent).join('/'))
    .join('_');
  return `https://lichess.org/analysis/standard/${path}`;
}

// ChessDB.cn (www.chessdb.cn) — an open, free, no-key cloud engine-evaluation
// database. Like Lichess it keys on the FULL FEN. Its JSON-ish query endpoint
//   cdb.php?action=queryall&board=<FEN>
// returns a `move:`-prefixed list of scored moves when the position is KNOWN to
// the database, or a status token ("unknown" / "nobestmove" / "invalid board"
// / "checkmate" / "stalemate") otherwise. We treat the presence of at least one
// `move:` entry as "catalogued"; terminal game states (mate/stalemate) and
// unknown are a clean miss. Existence is all we need — we don't parse scores.
// Human link-out uses ChessDB's OWN query-page scheme: spaces → `_`, `/` kept
// literal, NOT percent-encoded (encoding `/` breaks the page → it loads the
// START position, issue #158). NB: the cdb.php API call below is separate and
// DOES need encodeURIComponent on its `board=` param.
function chessdbHumanUrl(fen: string): string {
  return `https://www.chessdb.cn/queryc_en/?${fen.trim().replace(/ /g, '_')}`;
}

async function searchChessdb(fen: string): Promise<SearchResponse> {
  const url = chessdbHumanUrl(fen);
  const miss: SearchResponse = { found: false, database: 'CHESSDB', url };
  const api = `https://www.chessdb.cn/cdb.php?action=queryall&board=${encodeURIComponent(
    fen
  )}`;
  TRACE('CHESSDB', 'fen', fen);
  try {
    const text = await fetchText(api, { headers: { Accept: 'text/plain' } });
    if (text === null) {
      TRACE('CHESSDB', 'fetch', 'null (timeout/exhausted) → NOT_FOUND');
      return miss;
    }
    TRACE('CHESSDB', 'rawLen', text.length, 'head', text.slice(0, 60));
    // A known position returns one or more "move:<uci>,score:..." records.
    // Status tokens (unknown / nobestmove / invalid board / checkmate /
    // stalemate) carry no `move:` and are a clean miss.
    const found = /(^|[\s,])move:/i.test(text);
    TRACE('CHESSDB', 'found', found);
    return found ? { found: true, database: 'CHESSDB', url } : miss;
  } catch (err) {
    console.error('ChessDB parse error:', err);
    return miss;
  }
}

// Lichess Opening Explorer now requires an OAuth token (the previously-open
// endpoints return 401 anonymously — confirmed against the live API + OpenAPI
// `security: OAuth2`). Supply a Lichess Personal Access Token via the
// `LICHESS_TOKEN` function secret (`supabase secrets set LICHESS_TOKEN=...`).
// The token needs NO scopes — a plain PAT authenticates the explorer. Without
// it, Lichess degrades to a clean miss (still returns the link-out URL).
const LICHESS_TOKEN = Deno.env.get('LICHESS_TOKEN') ?? '';

async function searchLichess(fen: string): Promise<SearchResponse> {
  const url = lichessHumanUrl(fen);
  const miss: SearchResponse = { found: false, database: 'LICHESS', url };
  if (!LICHESS_TOKEN) {
    TRACE('LICHESS', 'no LICHESS_TOKEN secret → skip (clean miss)');
    return miss;
  }
  const qs = `fen=${encodeURIComponent(fen)}&moves=0&topGames=0&recentGames=0`;
  // Documented host is explorer.lichess.org (the .ovh alias also 401s anonymously).
  const masters = `https://explorer.lichess.org/masters?${qs}`;
  const online = `https://explorer.lichess.org/lichess?${qs}`;
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${LICHESS_TOKEN}`
  };
  TRACE('LICHESS', 'fen', fen);
  try {
    // SEQUENTIAL, not parallel: Lichess asks clients not to fire concurrent
    // requests, and the explorer shares one IP across all our users — two
    // simultaneous calls per search doubles our rate-limit exposure. Query the
    // masters DB first (smaller, faster, covers most named/opening positions);
    // only fall through to the broader online DB if masters has no game. This
    // halves request volume for any hit and keeps us well under the limit.
    const mText = await fetchText(masters, { headers });
    if (mText !== null && lichessHasGames(mText)) {
      TRACE('LICHESS', 'found', 'masters');
      return { found: true, database: 'LICHESS', url };
    }
    const oText = await fetchText(online, { headers });
    const found = oText !== null && lichessHasGames(oText);
    TRACE('LICHESS', 'found', found ? 'online' : false);
    return found ? { found: true, database: 'LICHESS', url } : miss;
  } catch (err) {
    console.error('Lichess parse error:', err);
    return miss;
  }
}

async function searchYacpdb(
  pieces: PlacedPiece[],
  board: string
): Promise<SearchResponse> {
  const want = yacPieceSet(pieces);
  const query = `Matrix('${[...want].join(' ')}')`;
  const humanUrl = yacpdbHumanUrl(board);
  const miss: SearchResponse = {
    found: false,
    database: 'YACPDB',
    url: humanUrl
  };
  TRACE('YACPDB', 'humanUrl', humanUrl);
  TRACE('YACPDB', 'want', [...want].sort());
  TRACE('YACPDB', 'query', query);
  try {
    const apiUrl = `https://www.yacpdb.org/gateway/ql?q=${encodeURIComponent(
      query
    )}`;
    const text = await fetchText(apiUrl, {
      headers: { Accept: 'application/json' }
    });
    if (text === null) {
      TRACE('YACPDB', 'fetch', 'null (timeout/exhausted) → NOT_FOUND');
      return miss;
    }
    TRACE('YACPDB', 'rawLen', text.length);

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      logDrift('YACPDB', apiUrl, text);
      return miss;
    }

    const d = data as {
      success?: boolean;
      error?: string;
      result?: { entries?: unknown; count?: unknown };
    };
    // A rejected query (bad predicate/grammar) returns success:false + a Python
    // traceback — that is OUR bug to fix, so log the raw body as drift.
    if (d.success !== true) {
      TRACE('YACPDB', 'success', false, '— logging drift');
      logDrift('YACPDB', apiUrl, text);
      return miss;
    }
    const entries = d.result?.entries;
    if (!Array.isArray(entries)) {
      TRACE('YACPDB', 'entries', 'not an array → NOT_FOUND');
      return miss;
    }
    TRACE('YACPDB', 'count', d.result?.count, 'entries', entries.length);

    // Exact-position filter: only an identical piece set counts as "found".
    let exact = false;
    for (let i = 0; i < entries.length; i++) {
      const eset = entryPieceSet(entries[i] as YacEntry);
      const hit = sameSet(eset, want);
      // Log per-entry so a near-miss (e.g. a token-format bug) is visible.
      TRACE('YACPDB', `entry[${i}]`, 'match', hit, 'set', [...eset].sort());
      if (hit) {
        exact = true;
        break;
      }
    }
    TRACE('YACPDB', 'exactMatch', exact);
    return exact ? { found: true, database: 'YACPDB', url: humanUrl } : miss;
  } catch (err) {
    console.error('YACPDB parse error:', err);
    return miss;
  }
}

Deno.serve(async (req: Request) => {
  // CORS preflight — must answer 200 with the allow-* headers BEFORE any auth
  // or body logic, or the browser blocks the real request. Status is explicit
  // (not relying on the Response default) so a preflight can never be non-2xx.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let fen = '';
  let noCache = false;
  try {
    const body = await req.json();
    fen = typeof body?.fen === 'string' ? body.fen : '';
    // Opt-in fresh lookup: `{ fen, nocache: true }` skips the cache READ so a
    // stale negative row (e.g. cached during an earlier broken deploy) cannot
    // mask a real hit. The fresh result is still WRITTEN back, healing the row.
    noCache = body?.nocache === true;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const board = boardField(fen);
  TRACE('REQ', 'fen', fen, 'board', board, 'noCache', noCache);

  // All four providers, each with its human link-out, all `found: false`. This
  // is what an invalid position or a total failure degrades to — never a bare
  // null — so the client always has a URL to link out to (issue #158).
  const baseMap = (): ProviderMap => ({
    lichess: { found: false, url: lichessHumanUrl(fen) },
    chessdb: { found: false, url: chessdbHumanUrl(fen) },
    pdb: { found: false, url: pdbUrl(parsePieces(board)) },
    yacpdb: { found: false, url: yacpdbHumanUrl(board) }
  });

  if (!isValidBoardField(board)) {
    // Malformed position — nothing to search; safe not-found (no upstream call).
    // pieces can't be derived from an invalid board, so emit the bare base.
    TRACE('REQ', 'invalid board field → NOT_FOUND');
    return json({
      lichess: { found: false, url: lichessHumanUrl(fen) },
      chessdb: { found: false, url: chessdbHumanUrl(fen) },
      pdb: { found: false, url: '' },
      yacpdb: { found: false, url: '' }
    } satisfies ProviderMap);
  }

  // Decompose once; both problem-DB queries are built from the same placed pieces.
  const pieces = parsePieces(board);
  TRACE('REQ', 'pieces', pieces.length, pieces);

  /** Reduce a SearchResponse to a ProviderHit (drop the now-redundant tag). */
  const toHit = (r: SearchResponse): ProviderHit => ({
    found: r.found,
    url: r.url ?? ''
  });

  // ---- Service-role Supabase client (RLS-exempt) for the cache table. -------
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // ---- 1. Cache check (board-keyed problem DBs only: PDB + YACPDB) ---------
  // Only PDB/YACPDB are cached: they key on the board field (matching the cache
  // key) and are SLOW, which is the whole reason the cache exists. Lichess and
  // ChessDB key on the FULL FEN — caching them under the board key would serve a
  // wrong answer for the same diagram with a different side-to-move/castling —
  // and they are fast + CDN-cached upstream, so they always run live below.
  let cachedPair: { pdb: ProviderHit; yacpdb: ProviderHit } | null = null;
  if (!noCache) {
    try {
      const { data: cached } = await supabase
        .from('db_search_cache')
        .select('providers, found, checked_at')
        .eq('fen_board', board)
        .maybeSingle();

      if (cached && isProviderPair(cached.providers)) {
        const age = Date.now() - new Date(cached.checked_at).getTime();
        // A row is "found" if EITHER problem DB hit; that drives the longer TTL.
        const anyFound = cached.found === true;
        const ttl = anyFound ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
        TRACE(
          'CACHE',
          'hit',
          cached.providers,
          'ageMs',
          age,
          'fresh',
          age < ttl
        );
        if (age < ttl) cachedPair = cached.providers;
      } else {
        TRACE('CACHE', 'miss (no usable row)');
      }
    } catch (err) {
      // Cache is best-effort; a cache failure must not block the search.
      console.error('Cache read failed:', err);
    }
  } else {
    TRACE('CACHE', 'bypassed (nocache=true)');
  }

  // ---- 1b. Lichess cache check (FULL-FEN keyed) ----------------------------
  // Lichess is the rate-limited provider whose IP we share across all users, so
  // unlike ChessDB it IS cached — but keyed on the FULL FEN (side-to-move /
  // castling / en-passant change the answer), under a synthetic `lfen|<fen>`
  // key in the same table. This collapses repeat lookups of the same position
  // to zero Lichess requests, which is the main rate-limit defence.
  let cachedLichess: ProviderHit | null = null;
  if (!noCache) {
    cachedLichess = await readLichessCache(supabase, fen);
  }

  // ---- 2. External lookup — provider-aware (issue #158) --------------------
  // Each provider resolved on its own key — no first-hit-wins ordering. Cache
  // hits (Lichess full-FEN, PDB/YACPDB board) skip the corresponding upstream.
  const map = baseMap();
  try {
    const [lichess, chessdb, pdb, yacpdb] = await Promise.all([
      cachedLichess ? Promise.resolve(null) : searchLichess(fen),
      searchChessdb(fen), // fast + not rate-limited → always live
      cachedPair ? Promise.resolve(null) : searchPdb(pieces),
      cachedPair ? Promise.resolve(null) : searchYacpdb(pieces, board)
    ]);
    map.lichess = cachedLichess ?? toHit(lichess as SearchResponse);
    map.chessdb = toHit(chessdb);
    map.pdb = cachedPair ? cachedPair.pdb : toHit(pdb as SearchResponse);
    map.yacpdb = cachedPair
      ? cachedPair.yacpdb
      : toHit(yacpdb as SearchResponse);
  } catch (err) {
    console.error('Search pipeline error:', err);
    // map already holds the safe base (all not-found with link-outs).
  }
  TRACE('REQ', 'final map', map);

  // ---- 3. Cache writes (best-effort; only freshly-fetched providers) -------
  // PDB/YACPDB pair under the board key; Lichess under its full-FEN key. Each
  // write is skipped when that result was served from cache (nothing new).
  if (!cachedPair) {
    try {
      const pair = { pdb: map.pdb, yacpdb: map.yacpdb };
      await supabase.from('db_search_cache').upsert(
        {
          fen_board: board,
          found: map.pdb.found || map.yacpdb.found,
          providers: pair,
          checked_at: new Date().toISOString()
        },
        { onConflict: 'fen_board' }
      );
    } catch (err) {
      console.error('Cache write failed:', err);
    }
  }
  if (!cachedLichess) {
    await writeLichessCache(supabase, fen, map.lichess);
  }

  return json(map);
});

/** Synthetic full-FEN cache key for Lichess (distinct from board-field keys). */
function lichessCacheKey(fen: string): string {
  return `lfen|${fen.trim()}`.slice(0, 100); // column CHECK is <= 100
}

/** The service-role Supabase client type (inferred from createClient). */
type ServiceClient = ReturnType<typeof createClient>;

/** Read a cached Lichess hit for this exact FEN, or null on miss/stale/error. */
async function readLichessCache(
  supabase: ServiceClient,
  fen: string
): Promise<ProviderHit | null> {
  try {
    const { data } = await supabase
      .from('db_search_cache')
      .select('providers, found, checked_at')
      .eq('fen_board', lichessCacheKey(fen))
      .maybeSingle();
    if (!data || !isHit(data.providers?.lichess)) {
      TRACE('CACHE', 'lichess miss (no usable row)');
      return null;
    }
    const age = Date.now() - new Date(data.checked_at).getTime();
    const ttl = data.found ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
    TRACE('CACHE', 'lichess hit', data.providers.lichess, 'fresh', age < ttl);
    return age < ttl ? (data.providers.lichess as ProviderHit) : null;
  } catch (err) {
    console.error('Lichess cache read failed:', err);
    return null;
  }
}

/** Persist a Lichess hit under its full-FEN key (best-effort). */
async function writeLichessCache(
  supabase: ServiceClient,
  fen: string,
  hit: ProviderHit
): Promise<void> {
  try {
    await supabase.from('db_search_cache').upsert(
      {
        fen_board: lichessCacheKey(fen),
        found: hit.found,
        providers: { lichess: hit },
        checked_at: new Date().toISOString()
      },
      { onConflict: 'fen_board' }
    );
  } catch (err) {
    console.error('Lichess cache write failed:', err);
  }
}

/** Runtime guard for a cached `{ pdb, yacpdb }` provider pair. */
function isProviderPair(
  v: unknown
): v is { pdb: ProviderHit; yacpdb: ProviderHit } {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return isHit(o['pdb']) && isHit(o['yacpdb']);
}

function isHit(v: unknown): v is ProviderHit {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o['found'] === 'boolean' && typeof o['url'] === 'string';
}
