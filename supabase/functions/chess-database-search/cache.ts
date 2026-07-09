import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.107.0';
import type { ProviderHit } from './types.ts';
import { trace } from './utils/trace.ts';

// Service client
export function makeServiceClient(url: string, key: string) {
  return createClient(url, key);
}

export type ServiceClient = ReturnType<typeof makeServiceClient>;

// Constants
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000;

// Helpers
export function lichessCacheKey(fen: string): string {
  return `lfen|${fen.trim()}`.slice(0, 100);
}

function isHit(v: unknown): v is ProviderHit {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o['found'] === 'boolean' && typeof o['url'] === 'string';
}

function ttlFor(found: boolean): number {
  return found ? CACHE_TTL_MS : NEGATIVE_TTL_MS;
}

export async function readCache<T extends Record<string, ProviderHit>>(
  db: ServiceClient,
  key: string,
  isValid: (v: unknown) => v is T
): Promise<T | null> {
  try {
    const { data } = await db
      .from('db_search_cache')
      .select('providers, found, checked_at')
      .eq('fen_board', key)
      .maybeSingle();

    if (!data || !isValid(data.providers)) return null;
    const age = Date.now() - new Date(data.checked_at as string).getTime();
    const ttl = ttlFor(data.found as boolean);
    trace('CACHE', key, 'hit', 'fresh', age < ttl);
    return age < ttl ? data.providers : null;
  } catch (err) {
    console.error(`Cache read failed for ${key}:`, err);
    return null;
  }
}

export async function writeCache(
  db: ServiceClient,
  key: string,
  providers: Record<string, ProviderHit>,
  found: boolean
): Promise<void> {
  try {
    await db.from('db_search_cache').upsert(
      {
        fen_board: key,
        found,
        providers,
        checked_at: new Date().toISOString()
      },
      { onConflict: 'fen_board' }
    );
  } catch (err) {
    console.error(`Cache write failed for ${key}:`, err);
  }
}

export function isLichessHit(v: unknown): v is { lichess: ProviderHit } {
  if (typeof v !== 'object' || v === null) return false;
  return isHit((v as Record<string, unknown>)['lichess']);
}

export function isProviderPair(
  v: unknown
): v is { pdb: ProviderHit; yacpdb: ProviderHit } {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return isHit(o['pdb']) && isHit(o['yacpdb']);
}
