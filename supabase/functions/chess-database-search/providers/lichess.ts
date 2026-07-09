import type { SearchResponse } from '../types.ts';
import { fetchText } from '../utils/fetch.ts';
import { trace } from '../utils/trace.ts';

// Constants
const LICHESS_TOKEN = Deno.env.get('LICHESS_TOKEN') ?? '';

// Types
interface LichessExplorerResponse {
  white?: unknown;
  draws?: unknown;
  black?: unknown;
}

// Helpers
function asCount(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
}

function hasGames(text: string): boolean {
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

export function lichessHumanUrl(fen: string): string {
  const path = fen
    .trim()
    .split(' ')
    .map((seg) => seg.split('/').map(encodeURIComponent).join('/'))
    .join('_');
  return `https://lichess.org/analysis/standard/${path}`;
}

// Search
export async function searchLichess(fen: string): Promise<SearchResponse> {
  const url = lichessHumanUrl(fen);
  const miss: SearchResponse = { found: false, database: 'LICHESS', url };
  if (!LICHESS_TOKEN) return miss;

  const qs = `fen=${encodeURIComponent(fen)}&moves=0&topGames=0&recentGames=0`;
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${LICHESS_TOKEN}`
  };

  trace('LICHESS', 'fen', fen);
  try {
    const mText = await fetchText(
      `https://explorer.lichess.org/masters?${qs}`,
      { headers }
    );
    if (mText !== null && hasGames(mText))
      return { found: true, database: 'LICHESS', url };

    const oText = await fetchText(
      `https://explorer.lichess.org/lichess?${qs}`,
      { headers }
    );
    const found = oText !== null && hasGames(oText);
    trace('LICHESS', 'found', found);
    return found ? { found: true, database: 'LICHESS', url } : miss;
  } catch (err) {
    console.error('Lichess error:', err);
    return miss;
  }
}
