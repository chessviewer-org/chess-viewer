import type { ServiceClient } from '../chess-database-search/cache.ts';

const encoder = new TextEncoder();

// Helpers
async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isFromTrustedProxy(req: Request): boolean {
  const secret = Deno.env.get('PROXY_SHARED_SECRET');
  if (!secret) return false;
  return req.headers.get('x-proxy-secret') === secret;
}

export function getClientIp(req: Request): string | null {
  return req.headers.get('x-real-client-ip');
}

export async function hashIp(ip: string): Promise<string> {
  const pepper = Deno.env.get('IP_HASH_SECRET') ?? 'chess-viewer-ip-pepper';
  return hmacSha256Hex(pepper, ip);
}

export async function hashSessionId(sessionId: string): Promise<string> {
  const pepper =
    Deno.env.get('SESSION_HASH_SECRET') ?? 'chess-viewer-session-pepper';
  return hmacSha256Hex(pepper, sessionId);
}

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export async function isIpVerified(
  db: ServiceClient,
  ipHash: string
): Promise<boolean> {
  try {
    const { data } = await db
      .from('verified_search_ips')
      .select('verified_at')
      .eq('ip_hash', ipHash)
      .maybeSingle();
    if (!data) return false;
    const age = Date.now() - new Date(data.verified_at as string).getTime();
    if (age > VERIFICATION_TTL_MS) return false;
    void db
      .from('verified_search_ips')
      .update({ last_used_at: new Date().toISOString() })
      .eq('ip_hash', ipHash)
      .then(undefined, () => {});
    return true;
  } catch (err) {
    console.error('IP verification lookup failed:', err);
    return false;
  }
}

export async function checkRateLimit(
  db: ServiceClient,
  hash: string,
  maxAttempts: number,
  windowSql: string
): Promise<boolean> {
  try {
    const { data, error } = await db.rpc('check_ip_rate_limit', {
      p_ip_hash: hash,
      p_max_attempts: maxAttempts,
      p_window: windowSql
    });
    if (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
    return data === true;
  } catch (err) {
    console.error('Rate limit check failed:', err);
    return false;
  }
}

export async function markIpVerified(
  db: ServiceClient,
  ipHash: string,
  userAgent: string | null
): Promise<void> {
  const now = new Date().toISOString();
  await db.from('verified_search_ips').upsert(
    {
      ip_hash: ipHash,
      verified_at: now,
      last_used_at: now,
      user_agent: userAgent ? userAgent.slice(0, 500) : null
    },
    { onConflict: 'ip_hash' }
  );
}
