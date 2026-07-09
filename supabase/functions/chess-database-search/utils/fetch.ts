// Constants
const FETCH_TIMEOUT_MS = 40_000;
const RETRY_ATTEMPTS = 1;
const RETRY_BACKOFF_MS = 600;
const RETRY_AFTER_CAP_MS = 5000;

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

// Types
type FetchAttempt =
  | { kind: 'ok'; text: string }
  | { kind: 'transient'; retryAfterMs?: number }
  | { kind: 'terminal' };

// Helpers
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const secs = Number(value);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const when = Date.parse(value);
  return Number.isFinite(when) ? Math.max(0, when - Date.now()) : undefined;
}

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
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(init?.headers ?? {})
      }
    });
    if (res.ok) return { kind: 'ok', text: await res.text() };
    if (res.status === 429) {
      const retryAfterMs = parseRetryAfter(res.headers.get('Retry-After'));
      console.error(`Upstream ${url} returned 429`);
      return retryAfterMs !== undefined
        ? { kind: 'transient', retryAfterMs }
        : { kind: 'transient' };
    }
    if (res.status >= 500) return { kind: 'transient' };
    return { kind: 'terminal' };
  } catch (err) {
    console.error(`Upstream ${url} failed:`, err);
    return { kind: 'transient' };
  } finally {
    clearTimeout(timer);
  }
}

// Fetch
export async function fetchText(
  url: string,
  init?: RequestInit
): Promise<string | null> {
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    const outcome = await fetchOnce(url, init);
    if (outcome.kind === 'ok') return outcome.text;
    if (outcome.kind === 'terminal') return null;
    if (attempt < RETRY_ATTEMPTS) {
      const wait =
        outcome.retryAfterMs !== undefined
          ? Math.min(
              Math.max(outcome.retryAfterMs, RETRY_BACKOFF_MS),
              RETRY_AFTER_CAP_MS
            )
          : RETRY_BACKOFF_MS;
      await sleep(wait);
    }
  }
  return null;
}
