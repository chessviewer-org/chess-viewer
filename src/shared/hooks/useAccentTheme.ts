import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';
import { getAccentTheme, normalizeAccentId } from '@constants';

import {
  ACCENT_CHANGE_EVENT,
  ACCENT_STORAGE_KEY,
  applyAccentVars,
  logger,
  readStoredAccentId,
  safeJSONParse
} from '@utils';

/**
 * App-level accent applier. Reads the persisted accent id and applies the
 * correct (dark vs light) `--val-accent*` triple for the active `mode`,
 * re-applying whenever `mode` flips (App owns `data-theme`). Also hydrates the
 * id from E2EE `syncStorage` for signed-in users and reacts to live changes
 * from the Appearance page (`ACCENT_CHANGE_EVENT`) and other tabs (`storage`).
 *
 * @param mode - The active site theme ('dark' | 'light')
 */
export function useAccentTheme(mode: 'dark' | 'light'): void {
  // Apply synchronously before paint for the current mode, and re-apply on flip.
  useLayoutEffect(() => {
    const reapply = () =>
      applyAccentVars(getAccentTheme(readStoredAccentId()), mode);

    reapply();

    const onAccentChange = () => reapply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCENT_STORAGE_KEY) reapply();
    };
    window.addEventListener(ACCENT_CHANGE_EVENT, onAccentChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ACCENT_CHANGE_EVENT, onAccentChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [mode]);

  // Hydrate the id from cloud sync (best-effort) once, then re-apply. Local
  // storage stays the synchronous source of truth above; this only fills in the
  // cloud preference for a freshly signed-in device.
  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      try {
        if (!syncStorage) return;
        const result = await syncStorage.get(ACCENT_STORAGE_KEY);
        if (cancelled || !result || typeof result.value !== 'string') return;
        const id = normalizeAccentId(
          safeJSONParse<string>(result.value, result.value)
        );
        const current = readStoredAccentId();
        if (id !== current) {
          window.localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify(id));
          window.dispatchEvent(new Event(ACCENT_CHANGE_EVENT));
        }
      } catch (err) {
        logger.error('Failed to hydrate accent from sync:', err);
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);
}

/**
 * Appearance-page accent control. Returns the current accent id and a setter
 * that persists to localStorage (synchronous truth) + E2EE `syncStorage`, and
 * dispatches `ACCENT_CHANGE_EVENT` so the live `useAccentTheme` applier updates
 * the document immediately.
 *
 * @returns The current accent id and a setter
 */
export function useAccentSetting(): [string, (id: string) => void] {
  const [accentId, setAccentId] = useState<string>(() => readStoredAccentId());

  // Keep in step with hydration from sync / other tabs.
  useEffect(() => {
    const sync = () => setAccentId(readStoredAccentId());
    window.addEventListener(ACCENT_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ACCENT_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const select = useCallback((id: string) => {
    const valid = normalizeAccentId(id);
    setAccentId(valid);
    try {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify(valid));
      window.dispatchEvent(new Event(ACCENT_CHANGE_EVENT));
      if (syncStorage)
        void syncStorage.set(ACCENT_STORAGE_KEY, JSON.stringify(valid));
    } catch (err) {
      logger.error('Failed to persist accent:', err);
    }
  }, []);

  return [accentId, select];
}
