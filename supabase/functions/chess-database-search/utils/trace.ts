const DEBUG = (Deno.env.get('DB_SEARCH_DEBUG') ?? '') === '1';
const DRIFT_LOG_CHARS = 2000;

export function trace(scope: string, ...parts: unknown[]): void {
  if (!DEBUG) return;
  const msg = parts
    .map((p) => (typeof p === 'object' ? JSON.stringify(p) : String(p)))
    .join(' ');
  console.log(`[DBSEARCH:${scope}] ${msg}`);
}

export function logDrift(provider: string, url: string, raw: string): void {
  const snippet = raw.slice(0, DRIFT_LOG_CHARS);
  const tail = raw.length > DRIFT_LOG_CHARS ? ' …[truncated]' : '';
  console.error(
    `[PARSER_DRIFT] ${provider} marker missing url=${url} len=${raw.length}\n${snippet}${tail}`
  );
}
