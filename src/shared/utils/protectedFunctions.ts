// Types
interface InvokeError {
  status?: number;
  message: string;
}

interface InvokeResult<T> {
  data: T | null;
  error: InvokeError | null;
}

// Constants
const BASE_URL =
  import.meta.env.VITE_DB_SEARCH_PROXY_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  '';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const SESSION_ID_KEY = 'cv_session_id';

// State
let sessionId: string | null = null;

// Helpers
export function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    const stored = localStorage.getItem(SESSION_ID_KEY);
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
  } catch {
    // localStorage unavailable (private mode, blocked storage) — fall through
  }
  sessionId = crypto.randomUUID();
  try {
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  } catch {
    // best-effort persistence only
  }
  return sessionId;
}

// Service
export async function invokeProtected<T>(
  name: string,
  body: unknown
): Promise<InvokeResult<T>> {
  try {
    const res = await fetch(`${BASE_URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    const data = text ? (JSON.parse(text) as Record<string, unknown>) : null;

    if (!res.ok) {
      const message =
        (data && typeof data['message'] === 'string' && data['message']) ||
        'request_failed';
      console.error(
        `[invokeProtected] ${name} -> ${res.status} at ${BASE_URL}/functions/v1/${name}:`,
        data
      );
      return { data: null, error: { status: res.status, message } };
    }

    return { data: data as T, error: null };
  } catch (err) {
    console.error(
      `[invokeProtected] ${name} -> network error at ${BASE_URL}/functions/v1/${name}:`,
      err
    );
    const message = err instanceof Error ? err.message : 'network_error';
    return { data: null, error: { message } };
  }
}
