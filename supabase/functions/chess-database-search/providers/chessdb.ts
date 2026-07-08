import type { SearchResponse } from '../types.ts';
import { fetchText } from '../utils/fetch.ts';
import { trace } from '../utils/trace.ts';

export function chessdbHumanUrl(fen: string): string {
  return `https://www.chessdb.cn/queryc_en/?${fen.trim().replace(/ /g, '_')}`;
}

export async function searchChessdb(fen: string): Promise<SearchResponse> {
  const url = chessdbHumanUrl(fen);
  const miss: SearchResponse = { found: false, database: 'CHESSDB', url };
  const api = `https://www.chessdb.cn/cdb.php?action=queryall&board=${encodeURIComponent(fen)}`;
  trace('CHESSDB', 'fen', fen);
  try {
    const text = await fetchText(api, { headers: { Accept: 'text/plain' } });
    if (text === null) return miss;
    const found = /(^|[\s,])move:/i.test(text);
    trace('CHESSDB', 'found', found);
    return found ? { found: true, database: 'CHESSDB', url } : miss;
  } catch (err) {
    console.error('ChessDB error:', err);
    return miss;
  }
}
