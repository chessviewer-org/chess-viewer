// Supabase Edge Function: chess-database-search
//
// Proxies position lookups to four chess databases (Lichess, ChessDB, PDB,
// YACPDB), bypassing browser CORS limits.
//
// Pipeline:  client FEN  ->  Postgres cache check (per provider)  ->  query
//            providers not served from cache (in parallel)  ->  cache write ->
//            per-provider JSON map.
//
// Response shape (always 200 unless the request itself is malformed) — a
// per-provider map so the client lights up each row from its own key, with no
// first-hit-wins shadowing:
//   { lichess:{found,url}, chessdb:{found,url}, pdb:{found,url}, yacpdb:{found,url} }
//
// Deno runtime — this file is NOT part of the Vite/tsc/eslint pipeline.

import type { PlacedPiece, ProviderHit, ProviderMap } from './types.ts';
import {
  readLichessCache,
  writeLichessCache,
  isProviderPair,
  makeServiceClient
} from './cache.ts';
import { boardField, isValidBoardField, parsePieces } from './utils/fen.ts';
import { trace } from './utils/trace.ts';
import { searchLichess } from './providers/lichess.ts';
import { searchChessdb } from './providers/chessdb.ts';
import { searchPdb, pdbUrl } from './providers/pdb.ts';
import { searchYacpdb, yacpdbHumanUrl } from './providers/yacpdb.ts';
import { lichessHumanUrl } from './providers/lichess.ts';
import { chessdbHumanUrl } from './providers/chessdb.ts';

// CORS allow-list. `Allow-Headers` must cover every header the Supabase JS
// client attaches to an invoke (authorization, apikey, x-client-info, the JSON
// content-type, and the newer x-supabase-api-version) — a header the browser
// asks about in the preflight that is NOT listed here makes the preflight fail
// and the real request never fires.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

function toHit(r: { found: boolean; url: string | null }): ProviderHit {
  return { found: r.found, url: r.url ?? '' };
}

Deno.serve(async (req: Request) => {
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
    noCache = body?.nocache === true;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const board = boardField(fen);
  trace('REQ', 'fen', fen, 'board', board, 'noCache', noCache);

  if (!isValidBoardField(board)) {
    trace('REQ', 'invalid board field → NOT_FOUND');
    return json({
      lichess: { found: false, url: lichessHumanUrl(fen) },
      chessdb: { found: false, url: chessdbHumanUrl(fen) },
      pdb: { found: false, url: '' },
      yacpdb: { found: false, url: '' }
    } satisfies ProviderMap);
  }

  const pieces: PlacedPiece[] = parsePieces(board);
  trace('REQ', 'pieces', pieces.length, pieces);

  const map: ProviderMap = {
    lichess: { found: false, url: lichessHumanUrl(fen) },
    chessdb: { found: false, url: chessdbHumanUrl(fen) },
    pdb: { found: false, url: pdbUrl(pieces) },
    yacpdb: { found: false, url: yacpdbHumanUrl(board) }
  };

  const supabase = makeServiceClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // ---- 1. Cache check (board-keyed problem DBs: PDB + YACPDB) --------------
  let cachedPair: { pdb: ProviderHit; yacpdb: ProviderHit } | null = null;
  if (!noCache) {
    try {
      const { data: cached } = await supabase
        .from('db_search_cache')
        .select('providers, found, checked_at')
        .eq('fen_board', board)
        .maybeSingle();

      if (cached && isProviderPair(cached.providers)) {
        const age =
          Date.now() - new Date(cached.checked_at as string).getTime();
        const ttl = cached.found === true ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
        trace(
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
        trace('CACHE', 'miss (no usable row)');
      }
    } catch (err) {
      console.error('Cache read failed:', err);
    }
  } else {
    trace('CACHE', 'bypassed (nocache=true)');
  }

  // ---- 1b. Lichess cache check (full-FEN keyed) -----------------------------
  const cachedLichess: ProviderHit | null = noCache
    ? null
    : await readLichessCache(supabase, fen);

  // ---- 2. External lookup — provider-aware, independent keys ---------------
  try {
    const [lichess, chessdb, pdb, yacpdb] = await Promise.all([
      cachedLichess ? null : searchLichess(fen),
      searchChessdb(fen),
      cachedPair ? null : searchPdb(pieces),
      cachedPair ? null : searchYacpdb(pieces, board)
    ]);
    if (cachedLichess) map.lichess = cachedLichess;
    else if (lichess) map.lichess = toHit(lichess);
    map.chessdb = toHit(chessdb);
    if (cachedPair) {
      map.pdb = cachedPair.pdb;
      map.yacpdb = cachedPair.yacpdb;
    } else {
      if (pdb) map.pdb = toHit(pdb);
      if (yacpdb) map.yacpdb = toHit(yacpdb);
    }
  } catch (err) {
    console.error('Search pipeline error:', err);
  }
  trace('REQ', 'final map', map);

  // ---- 3. Cache writes (best-effort; only freshly-fetched providers) ------
  if (!cachedPair) {
    try {
      await supabase.from('db_search_cache').upsert(
        {
          fen_board: board,
          found: map.pdb.found || map.yacpdb.found,
          providers: { pdb: map.pdb, yacpdb: map.yacpdb },
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
