import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.107.0';
import type { ProviderHit } from './types.ts';
import { trace } from './utils/trace.ts';

export function makeServiceClient(url: string, key: string) {
  return createClient(url, key);
}

export type ServiceClient = ReturnType<typeof makeServiceClient>;

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;

function lichessCacheKey(fen: string): string {
  return `lfen|${fen.trim()}`.slice(0, 100);
}

function isHit(v: unknown): v is ProviderHit {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o['found'] === 'boolean' && typeof o['url'] === 'string';
}

export function isProviderPair(
  v: unknown
): v is { pdb: ProviderHit; yacpdb: ProviderHit } {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return isHit(o['pdb']) && isHit(o['yacpdb']);
}

export function ttlFor(found: boolean): number {
  return found ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
}

export async function readLichessCache(
  db: ServiceClient,
  fen: string
): Promise<ProviderHit | null> {
  try {
    const { data } = await db
      .from('db_search_cache')
      .select('providers, found, checked_at')
      .eq('fen_board', lichessCacheKey(fen))
      .maybeSingle();

    if (!data || !isHit(data.providers?.lichess)) return null;
    const age = Date.now() - new Date(data.checked_at as string).getTime();
    const ttl = ttlFor(data.found as boolean);
    trace('CACHE', 'lichess hit', 'fresh', age < ttl);
    return age < ttl ? (data.providers.lichess as ProviderHit) : null;
  } catch (err) {
    console.error('Lichess cache read failed:', err);
    return null;
  }
}

export async function writeLichessCache(
  db: ServiceClient,
  fen: string,
  hit: ProviderHit
): Promise<void> {
  try {
    await db.from('db_search_cache').upsert(
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
