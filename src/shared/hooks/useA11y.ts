import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { syncStorage } from '@/auth/storage/syncStorage';
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
  DRAG_SENSITIVITY_CHANGE_EVENT,
  DRAG_SENSITIVITY_STORAGE_KEY,
  type DragSensitivity,
  readDragSensitivity,
  resolveReducedMotion
} from '@/shared/utils/a11yUtils';
import { hydrateFromSync } from '@/shared/utils/syncHydration';
import { logger } from '@/shared/utils/logger';

// Helpers
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

  const idle = typeof requestIdleCallback !== 'undefined';
  const id = idle ? requestIdleCallback(run) : window.setTimeout(run, 100);

  return () => {
    cancelled = true;
    if (idle) cancelIdleCallback(id as number);
    else clearTimeout(id);
  };
}

export function usePreferenceSetting<T extends string>(
  key: string,
  event: string,
  read: () => T
): [T, (next: T) => void] {
  const [pref, setPref] = useState(read);

  useEffect(() => {
    const sync = () => setPref(read());
    window.addEventListener(event, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(event, sync);
      window.removeEventListener('storage', sync);
    };
  }, [event, read]);

  const select = useCallback(
    (next: T) => {
      setPref(next);
      try {
        const value = JSON.stringify(next);
        window.localStorage.setItem(key, value);
        syncStorage?.set(key, value);
        window.dispatchEvent(new Event(event));
      } catch (err) {
        logger.error(`${key} save failed:`, err);
      }
    },
    [key, event]
  );

  return [pref, select];
}

// Color vision
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
  return usePreferenceSetting(
    COLOR_VISION_STORAGE_KEY,
    COLOR_VISION_CHANGE_EVENT,
    readColorVisionPreference
  );
}

// Contrast
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
  return usePreferenceSetting(
    CONTRAST_STORAGE_KEY,
    CONTRAST_CHANGE_EVENT,
    readContrastPreference
  );
}

// Reduced motion
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
  return usePreferenceSetting(
    REDUCED_MOTION_STORAGE_KEY,
    REDUCED_MOTION_CHANGE_EVENT,
    readReducedMotionPreference
  );
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

// Drag sensitivity
export function useDragSensitivitySetting(): [
  DragSensitivity,
  (next: DragSensitivity) => void
] {
  return usePreferenceSetting(
    DRAG_SENSITIVITY_STORAGE_KEY,
    DRAG_SENSITIVITY_CHANGE_EVENT,
    readDragSensitivity
  );
}
