import type { ProviderHit, ProviderMap } from './types.ts';
import {
  isLichessHit,
  lichessCacheKey,
  makeServiceClient,
  readCache,
  writeCache
} from './cache.ts';
import {
  checkRateLimit,
  getClientIp,
  hashIp,
  hashSessionId,
  isFromTrustedProxy,
  isIpVerified
} from '../_shared/ipGate.ts';
import { boardField, isValidBoardField } from './utils/fen.ts';
import { trace } from './utils/trace.ts';
import { searchLichess } from './providers/lichess.ts';
import { searchChessdb } from './providers/chessdb.ts';
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
const RATE_LIMIT_MAX_PER_HOUR = 150;
const SESSION_RATE_LIMIT_MAX_PER_HOUR = 60;
const SESSION_ID_MAX_LEN = 128;

function isValidSessionId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= SESSION_ID_MAX_LEN
  );
}

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
  if (!isFromTrustedProxy(req)) {
    return json({ error: 'forbidden' }, 403);
  }

  let fen = '';
  let noCache = false;
  let sessionId: string | null = null;
  try {
    const body = await req.json();
    fen = typeof body?.fen === 'string' ? body.fen : '';
    noCache = body?.nocache === true;
    sessionId = isValidSessionId(body?.sessionId) ? body.sessionId : null;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const supabase = makeServiceClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const ip = getClientIp(req);
  const ipHash = ip ? await hashIp(ip) : null;
  if (!ipHash || !(await isIpVerified(supabase, ipHash))) {
    trace('REQ', 'IP not verified → verification_required');
    return json(
      { error: 'verification_required', message: 'verification_required' },
      403
    );
  }
  if (
    !(await checkRateLimit(supabase, ipHash, RATE_LIMIT_MAX_PER_HOUR, '1 hour'))
  ) {
    trace('REQ', 'IP rate limited');
    return json({ error: 'rate_limited', message: 'rate_limited' }, 429);
  }
  if (sessionId) {
    const sessionHash = await hashSessionId(sessionId);
    if (
      !(await checkRateLimit(
        supabase,
        sessionHash,
        SESSION_RATE_LIMIT_MAX_PER_HOUR,
        '1 hour'
      ))
    ) {
      trace('REQ', 'session rate limited');
      return json({ error: 'rate_limited', message: 'rate_limited' }, 429);
    }
  }

  const board = boardField(fen);
  trace('REQ', 'fen', fen, 'board', board, 'noCache', noCache);

  if (!isValidBoardField(board)) {
    trace('REQ', 'invalid board field → NOT_FOUND');
    return json({
      lichess: { found: false, url: lichessHumanUrl(fen) },
      chessdb: { found: false, url: chessdbHumanUrl(fen) }
    } satisfies ProviderMap);
  }

  const map: ProviderMap = {
    lichess: { found: false, url: lichessHumanUrl(fen) },
    chessdb: { found: false, url: chessdbHumanUrl(fen) }
  };

  const cachedLichess = noCache
    ? null
    : ((await readCache(supabase, lichessCacheKey(fen), isLichessHit))
        ?.lichess ?? null);
  trace('CACHE', 'lichess', !!cachedLichess);

  try {
    const [lichess, chessdb] = await Promise.all([
      cachedLichess ? null : searchLichess(fen),
      searchChessdb(fen)
    ]);
    if (cachedLichess) map.lichess = cachedLichess;
    else if (lichess) map.lichess = toHit(lichess);
    map.chessdb = toHit(chessdb);
  } catch (err) {
    console.error('Search pipeline error:', err);
  }
  trace('REQ', 'final map', map);

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
