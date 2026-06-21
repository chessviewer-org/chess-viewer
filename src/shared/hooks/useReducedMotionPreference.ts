import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';

import {
  applyReducedMotion,
  hydrateFromSync,
  isReducedMotionPreference,
  logger,
  readReducedMotionPreference,
  REDUCED_MOTION_CHANGE_EVENT,
  REDUCED_MOTION_STORAGE_KEY,
  type ReducedMotionPreference,
  resolveReducedMotion
} from '@utils';

const OS_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * App-level reduced-motion applier. Writes the persisted `data-reduced-motion`
 * attribute before paint and re-applies on live changes (Accessibility page),
 * other tabs, and OS-level changes (when the preference is `system`). Mount
 * once at App level.
 */
export function useReducedMotionPreference(): void {
  useLayoutEffect(() => {
    const reapply = () => applyReducedMotion(readReducedMotionPreference());
    reapply();

    const onChange = () => reapply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === REDUCED_MOTION_STORAGE_KEY) reapply();
    };
    const media = window.matchMedia(OS_QUERY);

    window.addEventListener(REDUCED_MOTION_CHANGE_EVENT, onChange);
    window.addEventListener('storage', onStorage);
    media.addEventListener('change', onChange);
    return () => {
      window.removeEventListener(REDUCED_MOTION_CHANGE_EVENT, onChange);
      window.removeEventListener('storage', onStorage);
      media.removeEventListener('change', onChange);
    };
  }, []);

  // Hydrate the cloud preference once for a freshly signed-in device.
  useEffect(() => {
    let cancelled = false;
    const run = () =>
      void hydrateFromSync(
        REDUCED_MOTION_STORAGE_KEY,
        (decoded) => {
          if (!isReducedMotionPreference(decoded)) return;
          const current = window.localStorage.getItem(
            REDUCED_MOTION_STORAGE_KEY
          );
          const next = JSON.stringify(
            decoded satisfies ReducedMotionPreference
          );
          if (current !== next) {
            window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, next);
            window.dispatchEvent(new Event(REDUCED_MOTION_CHANGE_EVENT));
          }
        },
        () => cancelled,
        'reduced motion'
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
 * Accessibility-page reduced-motion control. Returns the current preference and
 * a setter that persists to localStorage (truth) + cloud `syncStorage`, and
 * dispatches `REDUCED_MOTION_CHANGE_EVENT` so the applier reacts immediately.
 */
export function useReducedMotionSetting(): [
  ReducedMotionPreference,
  (next: ReducedMotionPreference) => void
] {
  const [preference, setPreference] = useState<ReducedMotionPreference>(() =>
    readReducedMotionPreference()
  );

  useEffect(() => {
    const sync = () => setPreference(readReducedMotionPreference());
    window.addEventListener(REDUCED_MOTION_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(REDUCED_MOTION_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const select = useCallback((next: ReducedMotionPreference) => {
    setPreference(next);
    try {
      const value = JSON.stringify(next satisfies ReducedMotionPreference);
      window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, value);
      if (syncStorage) void syncStorage.set(REDUCED_MOTION_STORAGE_KEY, value);
      window.dispatchEvent(new Event(REDUCED_MOTION_CHANGE_EVENT));
    } catch (err) {
      logger.error('Failed to persist reduced motion preference:', err);
    }
  }, []);

  return [preference, select];
}

/**
 * Effective reduced-motion boolean for JS-driven motion (framer-motion).
 * Combines the in-app override with the OS setting so framer animations honour
 * the same preference the CSS does. Use in place of framer-motion's own
 * `useReducedMotion`, which only reads the OS media query and misses the
 * in-app override.
 */
export function useEffectiveReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    resolveReducedMotion(readReducedMotionPreference())
  );

  useEffect(() => {
    const sync = () =>
      setReduced(resolveReducedMotion(readReducedMotionPreference()));
    const media = window.matchMedia(OS_QUERY);

    window.addEventListener(REDUCED_MOTION_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    media.addEventListener('change', sync);
    return () => {
      window.removeEventListener(REDUCED_MOTION_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
      media.removeEventListener('change', sync);
    };
  }, []);

  return reduced;
}
