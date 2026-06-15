import { useCallback, useEffect, useState } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';

import {
  hydrateFromSync,
  isThemeModePreference,
  logger,
  readThemeModePreference,
  THEME_MODE_CHANGE_EVENT,
  THEME_MODE_STORAGE_KEY,
  type ThemeModePreference
} from '@utils';

/**
 * Appearance-page light/dark control. Returns the current mode preference
 * ('light' | 'dark' | 'system') and a setter that persists to localStorage
 * (synchronous truth) + E2EE `syncStorage`, and dispatches
 * `THEME_MODE_CHANGE_EVENT` so App applies the new `data-theme` immediately.
 *
 * 'system' is now an EXPLICIT, stored choice (the literal 'system'), not the
 * absence of a key — because no key now defaults to DARK. A fresh user (nothing
 * stored) sees the Dark radio pre-selected via {@link readThemeModePreference}.
 *
 * @returns The current preference and a setter
 */
export function useThemeMode(): [
  ThemeModePreference,
  (next: ThemeModePreference) => void
] {
  const [preference, setPreference] = useState<ThemeModePreference>(() =>
    readThemeModePreference()
  );

  // Keep in step with hydration from sync / other tabs.
  useEffect(() => {
    const sync = () => setPreference(readThemeModePreference());
    window.addEventListener(THEME_MODE_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(THEME_MODE_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const select = useCallback((next: ThemeModePreference) => {
    setPreference(next);
    try {
      // Every choice (incl. 'system') is now an explicit stored value, since
      // absence of a key means DARK. Persist local (truth) + E2EE (best-effort).
      const value = JSON.stringify(next satisfies ThemeModePreference);
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, value);
      if (syncStorage) void syncStorage.set(THEME_MODE_STORAGE_KEY, value);
      window.dispatchEvent(new Event(THEME_MODE_CHANGE_EVENT));
    } catch (err) {
      logger.error('Failed to persist theme mode:', err);
    }
  }, []);

  return [preference, select];
}

/**
 * One-time hydration of the theme-mode preference from E2EE `syncStorage` for a
 * freshly signed-in device. Local storage stays the synchronous source of truth;
 * this only fills in the cloud preference, then fires `THEME_MODE_CHANGE_EVENT`
 * so App re-resolves `data-theme`. Mount once (App-level).
 *
 * Under the "system is explicit" model a remote 'system' is honoured too: it is
 * a real stored choice that should follow the OS on this device.
 */
export function useThemeModeSync(): void {
  useEffect(() => {
    let cancelled = false;
    void hydrateFromSync(
      THEME_MODE_STORAGE_KEY,
      (decoded) => {
        if (!isThemeModePreference(decoded)) return;
        const current = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
        const next = JSON.stringify(decoded satisfies ThemeModePreference);
        if (current !== next) {
          window.localStorage.setItem(THEME_MODE_STORAGE_KEY, next);
          window.dispatchEvent(new Event(THEME_MODE_CHANGE_EVENT));
        }
      },
      () => cancelled,
      'theme mode'
    );
    return () => {
      cancelled = true;
    };
  }, []);
}
