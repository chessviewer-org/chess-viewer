// Supabase Edge Function: chess-database-search
//
// Proxies position lookups to the PDB (pdb.dieschwalbe.de) and YACPDB
// (yacpdb.org) chess-problem databases, bypassing browser CORS limits.
//
// Pipeline:  client FEN  ->  Postgres cache check  ->  (on miss) external
//            fetch + HTML parse  ->  cache write  ->  unified JSON.
//
// Response shape (always 200 unless the request itself is malformed):
//   { found: boolean, database: string | null, url: string | null }
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SearchResponse {
  found: boolean;
  database: string | null;
  url: string | null;
}

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
// Per-attempt request timeout (ms). MEASURED upstream TTFB: YACPDB ~11–12s,
// PDB ~9s (server-side matrix search is genuinely slow — NOT bot-blocking; both
// return 200 regardless of User-Agent). 5s aborted before either could answer,
// which was the sole cause of the "exhausted N attempts" timeouts. 20s clears
// the worst case with headroom.
const FETCH_TIMEOUT_MS = 20000;
// Extra attempts after the first on a TRANSIENT failure (timeout/5xx/network).
// Kept at 1 (was 2): at a 20s budget per attempt, stacking retries would push a
// fully-failing lookup past sane edge-execution / client-wait limits. One retry
// covers a genuine transient blip without ballooning worst-case latency.
const RETRY_ATTEMPTS = 1;
// Backoff before each retry (ms); index 0 → before 1st retry, etc.
const RETRY_BACKOFF_MS = [600];
// How much raw upstream body to echo into logs on parser drift (chars).
const DRIFT_LOG_CHARS = 2000;

const NOT_FOUND: SearchResponse = { found: false, database: null, url: null };

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
 *  - `transient` : timeout / 5xx / network error — safe to retry.
 */
type FetchAttempt =
  | { kind: 'ok'; text: string }
  | { kind: 'terminal' }
  | { kind: 'transient' };

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
    // 5xx → transient (upstream hiccup); 4xx → terminal (it rejected us).
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
    // transient: back off and retry unless the budget is spent.
    if (attempt < RETRY_ATTEMPTS) {
      await sleep(RETRY_BACKOFF_MS[attempt] ?? RETRY_BACKOFF_MS.at(-1) ?? 500);
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
  TRACE('PDB', 'expression', expression);
  try {
    const html = await fetchText(url);
    if (html === null) {
      TRACE('PDB', 'fetch', 'null (timeout/exhausted) → NOT_FOUND');
      return NOT_FOUND;
    }
    TRACE('PDB', 'rawLen', html.length);
    // A rejected query renders an error <section> instead of a result count;
    // surface it as drift (our expression grammar would be at fault).
    if (/the search command is not correct/i.test(html)) {
      TRACE('PDB', 'rejected', 'search command not correct — logging drift');
      logDrift('PDB', url, html);
      return NOT_FOUND;
    }
    // Explicit empty result — a clean miss, NOT a layout change. Recognising it
    // keeps the drift log quiet for the common no-hit case.
    if (/no problems? (have|has) been found/i.test(html)) {
      TRACE('PDB', 'result', 'explicit "no problems found" → NOT_FOUND');
      return NOT_FOUND;
    }
    // PDB prints "N problem(s) found"; any non-zero count is a hit. A missing
    // marker on an otherwise-OK page means the layout changed → log + degrade.
    const m = html.match(/(\d+)\s+problem\(?s?\)?\s+found/i);
    if (!m) {
      TRACE('PDB', 'marker', 'absent — logging drift');
      logDrift('PDB', url, html);
      return NOT_FOUND;
    }
    const count = parseInt(m[1] ?? '0', 10);
    TRACE('PDB', 'count', count);
    return count > 0 ? { found: true, database: 'PDB', url } : NOT_FOUND;
  } catch (err) {
    console.error('PDB parse error:', err);
    return NOT_FOUND;
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

/** Human-facing link: opens the position on Lichess' analysis board, whose
 *  Opening Explorer panel then lists the games/continuations. */
function lichessHumanUrl(fen: string): string {
  return `https://lichess.org/analysis?fen=${encodeURIComponent(fen)}`;
}

async function searchLichess(fen: string): Promise<SearchResponse> {
  const url = lichessHumanUrl(fen);
  const qs = `fen=${encodeURIComponent(fen)}&moves=0&topGames=0&recentGames=0`;
  const masters = `https://explorer.lichess.ovh/masters?${qs}`;
  const online = `https://explorer.lichess.ovh/lichess?${qs}`;
  TRACE('LICHESS', 'fen', fen);
  try {
    const [mText, oText] = await Promise.all([
      fetchText(masters, { headers: { Accept: 'application/json' } }),
      fetchText(online, { headers: { Accept: 'application/json' } })
    ]);
    const found =
      (mText !== null && lichessHasGames(mText)) ||
      (oText !== null && lichessHasGames(oText));
    TRACE('LICHESS', 'found', found);
    return found ? { found: true, database: 'LICHESS', url } : NOT_FOUND;
  } catch (err) {
    console.error('Lichess parse error:', err);
    return NOT_FOUND;
  }
}

async function searchYacpdb(
  pieces: PlacedPiece[],
  board: string
): Promise<SearchResponse> {
  const want = yacPieceSet(pieces);
  const query = `Matrix('${[...want].join(' ')}')`;
  const humanUrl = yacpdbHumanUrl(board);
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
      return NOT_FOUND;
    }
    TRACE('YACPDB', 'rawLen', text.length);

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      logDrift('YACPDB', apiUrl, text);
      return NOT_FOUND;
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
      return NOT_FOUND;
    }
    const entries = d.result?.entries;
    if (!Array.isArray(entries)) {
      TRACE('YACPDB', 'entries', 'not an array → NOT_FOUND');
      return NOT_FOUND;
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
    return exact
      ? { found: true, database: 'YACPDB', url: humanUrl }
      : NOT_FOUND;
  } catch (err) {
    console.error('YACPDB parse error:', err);
    return NOT_FOUND;
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
  if (!isValidBoardField(board)) {
    // Malformed position — nothing to search; safe not-found (no upstream call).
    TRACE('REQ', 'invalid board field → NOT_FOUND');
    return json(NOT_FOUND);
  }

  // Decompose once; both upstream queries are built from the same placed pieces.
  const pieces = parsePieces(board);
  TRACE('REQ', 'pieces', pieces.length, pieces);

  // ---- Service-role Supabase client (RLS-exempt) for the cache table. -------
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // ---- 1. Cache check ------------------------------------------------------
  if (!noCache) {
    try {
      const { data: cached } = await supabase
        .from('db_search_cache')
        .select('found, database, url, checked_at')
        .eq('fen_board', board)
        .maybeSingle();

      if (cached) {
        const age = Date.now() - new Date(cached.checked_at).getTime();
        const ttl = cached.found ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
        TRACE(
          'CACHE',
          'hit',
          { found: cached.found, database: cached.database },
          'ageMs',
          age,
          'ttlMs',
          ttl,
          'fresh',
          age < ttl
        );
        if (age < ttl) {
          return json({
            found: cached.found,
            database: cached.database,
            url: cached.url
          });
        }
      } else {
        TRACE('CACHE', 'miss (no row)');
      }
    } catch (err) {
      // Cache is best-effort; a cache failure must not block the search.
      console.error('Cache read failed:', err);
    }
  } else {
    TRACE('CACHE', 'bypassed (nocache=true)');
  }

  // ---- 2. External lookup (Lichess → PDB → YACPDB; first hit wins) ---------
  // Lichess is first: it is the fastest upstream and answers the primary
  // "which games reached this position?" question. It keys on the FULL FEN
  // (not the board field), so it receives `fen` directly. PDB/YACPDB only run
  // if Lichess misses, preserving their slower problem-database lookups.
  let result: SearchResponse = NOT_FOUND;
  try {
    const lichess = await searchLichess(fen);
    if (lichess.found) {
      result = lichess;
    } else {
      const pdb = await searchPdb(pieces);
      if (pdb.found) {
        result = pdb;
      } else {
        const yac = await searchYacpdb(pieces, board);
        if (yac.found) result = yac;
      }
    }
  } catch (err) {
    console.error('Search pipeline error:', err);
    result = NOT_FOUND;
  }
  TRACE('REQ', 'final result', result);

  // ---- 3. Cache write (best-effort) ---------------------------------------
  // Skip caching Lichess hits: the cache is keyed on `fen_board` (board field
  // only), but a Lichess result depends on the FULL FEN — caching it under the
  // board key would wrongly serve it for the same diagram with a different
  // side-to-move / castling state. Lichess is fast and CDN-cached upstream, so
  // a cache-less round-trip is cheap. PDB/YACPDB (board-field results) cache as
  // before.
  if (result.database === 'LICHESS') {
    return json(result);
  }
  try {
    await supabase.from('db_search_cache').upsert(
      {
        fen_board: board,
        found: result.found,
        database: result.database,
        url: result.url,
        checked_at: new Date().toISOString()
      },
      { onConflict: 'fen_board' }
    );
  } catch (err) {
    console.error('Cache write failed:', err);
  }

  return json(result);
});
