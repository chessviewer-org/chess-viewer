import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';

import {
  applyColorVision,
  COLOR_VISION_CHANGE_EVENT,
  COLOR_VISION_STORAGE_KEY,
  type ColorVisionPreference,
  hydrateFromSync,
  isColorVisionPreference,
  logger,
  readColorVisionPreference
} from '@utils';

/**
 * App-level CVD filter applier. Applies the persisted filter before paint and
 * re-applies on live changes and other tabs. Mount once at App level.
 */
export function useColorVision(): void {
  useLayoutEffect(() => {
    const reapply = () => applyColorVision(readColorVisionPreference());
    reapply();

    const onChange = () => reapply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === COLOR_VISION_STORAGE_KEY) reapply();
    };
    window.addEventListener(COLOR_VISION_CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(COLOR_VISION_CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () =>
      void hydrateFromSync(
        COLOR_VISION_STORAGE_KEY,
        (decoded) => {
          if (!isColorVisionPreference(decoded)) return;
          const current = window.localStorage.getItem(COLOR_VISION_STORAGE_KEY);
          const next = JSON.stringify(decoded satisfies ColorVisionPreference);
          if (current !== next) {
            window.localStorage.setItem(COLOR_VISION_STORAGE_KEY, next);
            window.dispatchEvent(new Event(COLOR_VISION_CHANGE_EVENT));
          }
        },
        () => cancelled,
        'color vision'
      );

    const id =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(run)
        : setTimeout(run, 100);
    return () => {
      cancelled = true;
      if (typeof requestIdleCallback !== 'undefined') {
        cancelIdleCallback(id as number);
      } else {
        clearTimeout(id as ReturnType<typeof setTimeout>);
      }
    };
  }, []);
}

/**
 * Settings-page color vision control. Returns the current preference and a
 * setter that persists to localStorage + cloud `syncStorage` and dispatches
 * `COLOR_VISION_CHANGE_EVENT` so `useColorVision` applies it immediately.
 */
export function useColorVisionSetting(): [
  ColorVisionPreference,
  (next: ColorVisionPreference) => void
] {
  const [preference, setPreference] = useState<ColorVisionPreference>(() =>
    readColorVisionPreference()
  );

  useEffect(() => {
    const sync = () => setPreference(readColorVisionPreference());
    window.addEventListener(COLOR_VISION_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COLOR_VISION_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const select = useCallback((next: ColorVisionPreference) => {
    setPreference(next);
    try {
      const value = JSON.stringify(next satisfies ColorVisionPreference);
      window.localStorage.setItem(COLOR_VISION_STORAGE_KEY, value);
      if (syncStorage) void syncStorage.set(COLOR_VISION_STORAGE_KEY, value);
      window.dispatchEvent(new Event(COLOR_VISION_CHANGE_EVENT));
    } catch (err: unknown) {
      logger.error('Failed to persist color vision preference:', err);
    }
  }, []);

  return [preference, select];
}
