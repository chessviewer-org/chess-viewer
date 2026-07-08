import { syncStorage } from '@/auth';

import { logger } from './logger';
import { safeJSONParse } from '@chessviewer-org/chess-viewer';

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
  } catch (err: unknown) {
    logger.error(`Failed to hydrate ${label} from sync:`, err);
  }
}
