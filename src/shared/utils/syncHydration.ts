import { syncStorage } from '@/features/auth/services/syncStorage';

import { logger } from './logger';
import { safeJSONParse } from './validation';

/**
 * Shared best-effort cloud-hydrate body for a single settings key. Reads the
 * cloud `syncStorage` value, JSON-parses it, and hands the raw decoded value to
 * `apply`, which decides whether/how to adopt it locally. Local storage stays
 * the synchronous source of truth; this only fills in a freshly signed-in
 * device's cloud preference. Never throws — failures are logged.
 *
 * Each call-site owns its own effect, guard (mount-once / ref), and write-back
 * semantics; this only removes the duplicated read-parse-catch scaffolding.
 *
 * @param key - The synced storage key.
 * @param apply - Receives the decoded value; applies it if it should win.
 * @param isCancelled - Returns true once the caller has unmounted.
 * @param label - Human label used in the error log line.
 */
export async function hydrateFromSync(
  key: string,
  apply: (decoded: unknown) => void,
  isCancelled: () => boolean,
  label: string
): Promise<void> {
  try {
    if (!syncStorage) return;
    const result = await syncStorage.get(key);
    if (isCancelled() || !result || typeof result.value !== 'string') return;
    apply(safeJSONParse<unknown>(result.value, result.value));
  } catch (err) {
    logger.error(`Failed to hydrate ${label} from sync:`, err);
  }
}
