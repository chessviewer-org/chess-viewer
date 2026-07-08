import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { syncStorage } from '@/auth';
import {
  applyColorVision,
  COLOR_VISION_CHANGE_EVENT,
  COLOR_VISION_STORAGE_KEY,
  type ColorVisionPreference,
  readColorVisionPreference,
  isColorVisionPreference,
  applyContrast,
  CONTRAST_CHANGE_EVENT,
  CONTRAST_STORAGE_KEY,
  type ContrastPreference,
  readContrastPreference,
  isContrastPreference,
  applyReducedMotion,
  REDUCED_MOTION_CHANGE_EVENT,
  REDUCED_MOTION_STORAGE_KEY,
  type ReducedMotionPreference,
  readReducedMotionPreference,
  isReducedMotionPreference,
  hydrateFromSync,
  logger,
  resolveReducedMotion
} from '@/shared/utils';

function syncFromCloud(
  key: string,
  event: string,
  isValid: (v: unknown) => boolean
): () => void {
  let cancelled = false;

  const run = () =>
    hydrateFromSync(
      key,
      (decoded) => {
        if (!isValid(decoded)) return;
        const next = JSON.stringify(decoded);
        if (window.localStorage.getItem(key) !== next) {
          window.localStorage.setItem(key, next);
          window.dispatchEvent(new Event(event));
        }
      },
      () => cancelled,
      key
    );

  const hasIdleCallback = typeof requestIdleCallback !== 'undefined';
  const id = hasIdleCallback ? requestIdleCallback(run) : setTimeout(run, 100);

  return () => {
    cancelled = true;
    if (hasIdleCallback) {
      cancelIdleCallback(id as number);
    } else {
      clearTimeout(id as ReturnType<typeof setTimeout>);
    }
  };
}

export function useColorVision(): void {
  useLayoutEffect(() => {
    const apply = () => applyColorVision(readColorVisionPreference());
    apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === COLOR_VISION_STORAGE_KEY) apply();
    };
    window.addEventListener(COLOR_VISION_CHANGE_EVENT, apply);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(COLOR_VISION_CHANGE_EVENT, apply);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(
    () =>
      syncFromCloud(
        COLOR_VISION_STORAGE_KEY,
        COLOR_VISION_CHANGE_EVENT,
        isColorVisionPreference
      ),
    []
  );
}

export function useColorVisionSetting(): [
  ColorVisionPreference,
  (next: ColorVisionPreference) => void
] {
  const [pref, setPref] = useState(readColorVisionPreference);

  useEffect(() => {
    const sync = () => setPref(readColorVisionPreference());
    window.addEventListener(COLOR_VISION_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COLOR_VISION_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const select = useCallback((next: ColorVisionPreference) => {
    setPref(next);
    try {
      const value = JSON.stringify(next);
      window.localStorage.setItem(COLOR_VISION_STORAGE_KEY, value);
      syncStorage?.set(COLOR_VISION_STORAGE_KEY, value);
      window.dispatchEvent(new Event(COLOR_VISION_CHANGE_EVENT));
    } catch (err) {
      logger.error('color vision save failed:', err);
    }
  }, []);

  return [pref, select];
}

export function useContrast(): void {
  useLayoutEffect(() => {
    const apply = () => applyContrast(readContrastPreference());
    apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONTRAST_STORAGE_KEY) apply();
    };
    window.addEventListener(CONTRAST_CHANGE_EVENT, apply);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CONTRAST_CHANGE_EVENT, apply);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(
    () =>
      syncFromCloud(
        CONTRAST_STORAGE_KEY,
        CONTRAST_CHANGE_EVENT,
        isContrastPreference
      ),
    []
  );
}

export function useContrastSetting(): [
  ContrastPreference,
  (next: ContrastPreference) => void
] {
  const [pref, setPref] = useState(readContrastPreference);

  useEffect(() => {
    const sync = () => setPref(readContrastPreference());
    window.addEventListener(CONTRAST_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONTRAST_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const select = useCallback((next: ContrastPreference) => {
    setPref(next);
    try {
      const value = JSON.stringify(next);
      window.localStorage.setItem(CONTRAST_STORAGE_KEY, value);
      syncStorage?.set(CONTRAST_STORAGE_KEY, value);
      window.dispatchEvent(new Event(CONTRAST_CHANGE_EVENT));
    } catch (err) {
      logger.error('contrast save failed:', err);
    }
  }, []);

  return [pref, select];
}

const OS_REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export function useReducedMotionPreference(): void {
  useLayoutEffect(() => {
    const apply = () => applyReducedMotion(readReducedMotionPreference());
    apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === REDUCED_MOTION_STORAGE_KEY) apply();
    };
    const media = window.matchMedia(OS_REDUCED_MOTION);
    window.addEventListener(REDUCED_MOTION_CHANGE_EVENT, apply);
    window.addEventListener('storage', onStorage);
    media.addEventListener('change', apply);
    return () => {
      window.removeEventListener(REDUCED_MOTION_CHANGE_EVENT, apply);
      window.removeEventListener('storage', onStorage);
      media.removeEventListener('change', apply);
    };
  }, []);

  useEffect(
    () =>
      syncFromCloud(
        REDUCED_MOTION_STORAGE_KEY,
        REDUCED_MOTION_CHANGE_EVENT,
        isReducedMotionPreference
      ),
    []
  );
}

export function useReducedMotionSetting(): [
  ReducedMotionPreference,
  (next: ReducedMotionPreference) => void
] {
  const [pref, setPref] = useState(readReducedMotionPreference);

  useEffect(() => {
    const sync = () => setPref(readReducedMotionPreference());
    window.addEventListener(REDUCED_MOTION_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(REDUCED_MOTION_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const select = useCallback((next: ReducedMotionPreference) => {
    setPref(next);
    try {
      const value = JSON.stringify(next);
      window.localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, value);
      syncStorage?.set(REDUCED_MOTION_STORAGE_KEY, value);
      window.dispatchEvent(new Event(REDUCED_MOTION_CHANGE_EVENT));
    } catch (err) {
      logger.error('reduced motion save failed:', err);
    }
  }, []);

  return [pref, select];
}

export function useEffectiveReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    resolveReducedMotion(readReducedMotionPreference())
  );

  useEffect(() => {
    const sync = () =>
      setReduced(resolveReducedMotion(readReducedMotionPreference()));
    const media = window.matchMedia(OS_REDUCED_MOTION);
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
