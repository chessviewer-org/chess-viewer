import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';

import {
  applyContrast,
  CONTRAST_CHANGE_EVENT,
  CONTRAST_STORAGE_KEY,
  type ContrastPreference,
  hydrateFromSync,
  isContrastPreference,
  logger,
  readContrastPreference
} from '@utils';

/**
 * App-level contrast applier. Applies the persisted `data-contrast` attribute
 * before paint and re-applies on live changes (Appearance page) and other tabs.
 * Mount once at App level.
 */
export function useContrast(): void {
  useLayoutEffect(() => {
    const reapply = () => applyContrast(readContrastPreference());
    reapply();

    const onChange = () => reapply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONTRAST_STORAGE_KEY) reapply();
    };
    window.addEventListener(CONTRAST_CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CONTRAST_CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Hydrate the cloud preference once for a freshly signed-in device.
  useEffect(() => {
    let cancelled = false;
    void hydrateFromSync(
      CONTRAST_STORAGE_KEY,
      (decoded) => {
        if (!isContrastPreference(decoded)) return;
        const current = window.localStorage.getItem(CONTRAST_STORAGE_KEY);
        const next = JSON.stringify(decoded satisfies ContrastPreference);
        if (current !== next) {
          window.localStorage.setItem(CONTRAST_STORAGE_KEY, next);
          window.dispatchEvent(new Event(CONTRAST_CHANGE_EVENT));
        }
      },
      () => cancelled,
      'contrast'
    );
    return () => {
      cancelled = true;
    };
  }, []);
}

/**
 * Appearance-page contrast control. Returns the current preference and a setter
 * that persists to localStorage (truth) + E2EE `syncStorage`, and dispatches
 * `CONTRAST_CHANGE_EVENT` so `useContrast` applies it immediately.
 */
export function useContrastSetting(): [
  ContrastPreference,
  (next: ContrastPreference) => void
] {
  const [preference, setPreference] = useState<ContrastPreference>(() =>
    readContrastPreference()
  );

  useEffect(() => {
    const sync = () => setPreference(readContrastPreference());
    window.addEventListener(CONTRAST_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONTRAST_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const select = useCallback((next: ContrastPreference) => {
    setPreference(next);
    try {
      const value = JSON.stringify(next satisfies ContrastPreference);
      window.localStorage.setItem(CONTRAST_STORAGE_KEY, value);
      if (syncStorage) void syncStorage.set(CONTRAST_STORAGE_KEY, value);
      window.dispatchEvent(new Event(CONTRAST_CHANGE_EVENT));
    } catch (err) {
      logger.error('Failed to persist contrast:', err);
    }
  }, []);

  return [preference, select];
}
