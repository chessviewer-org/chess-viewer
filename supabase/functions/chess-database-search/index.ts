import type { PlacedPiece, ProviderHit, ProviderMap } from './types.ts';
import {
  isLichessHit,
  isProviderPair,
  lichessCacheKey,
  makeServiceClient,
  readCache,
  writeCache
} from './cache.ts';
import { boardField, isValidBoardField, parsePieces } from './utils/fen.ts';
import { trace } from './utils/trace.ts';
import { searchLichess } from './providers/lichess.ts';
import { searchChessdb } from './providers/chessdb.ts';
import { searchPdb, pdbUrl } from './providers/pdb.ts';
import { searchYacpdb, yacpdbHumanUrl } from './providers/yacpdb.ts';
import { lichessHumanUrl } from './providers/lichess.ts';
import { chessdbHumanUrl } from './providers/chessdb.ts';

// Constants
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Helpers
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

function toHit(r: { found: boolean; url: string | null }): ProviderHit {
  return { found: r.found, url: r.url ?? '' };
}

// Handler
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

  // Cache check
  const cachedPair = noCache
    ? null
    : await readCache(supabase, board, isProviderPair);
  const cachedLichess = noCache
    ? null
    : ((await readCache(supabase, lichessCacheKey(fen), isLichessHit))
        ?.lichess ?? null);
  trace('CACHE', 'pair', !!cachedPair, 'lichess', !!cachedLichess);

  // External lookup
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

  // Cache writes
  if (!cachedPair) {
    await writeCache(
      supabase,
      board,
      { pdb: map.pdb, yacpdb: map.yacpdb },
      map.pdb.found || map.yacpdb.found
    );
  }
  if (!cachedLichess) {
    await writeCache(
      supabase,
      lichessCacheKey(fen),
      { lichess: map.lichess },
      map.lichess.found
    );
  }

  return json(map);
});
