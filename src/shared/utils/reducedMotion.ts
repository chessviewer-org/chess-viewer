/**
 * Reduced-motion preference persistence + application helpers.
 *
 * ChessVision honours the OS `prefers-reduced-motion` media query by default,
 * but also offers an in-app override so a user can force animations off (or
 * back on) regardless of their system setting. The override is applied via a
 * `data-reduced-motion="reduce"` attribute on the document element that
 * `src/index.css` keys its motion-killing rules off (alongside the media query).
 *
 * Mirrors the accent / theme-mode / contrast pattern: localStorage is the
 * synchronous source of truth, `syncStorage` is best-effort, and an
 * in-app event lets a change on the Accessibility page reach App immediately.
 */

import { safeJSONParse } from './validation';

/**
 * The three reduced-motion override modes:
 * - `system` — follow the OS `prefers-reduced-motion` setting (default).
 * - `reduce` — force animations off, regardless of the OS setting.
 * - `full`   — force full motion, regardless of the OS setting.
 */
export type ReducedMotionPreference = 'system' | 'reduce' | 'full';

/** Effective preference when nothing is stored. */
export const DEFAULT_REDUCED_MOTION: ReducedMotionPreference = 'system';

/** localStorage key for the reduced-motion preference (synced-key convention). */
export const REDUCED_MOTION_STORAGE_KEY = 'cv_reduced_motion';

/** In-app event so a live change (Accessibility page) reaches App at once. */
export const REDUCED_MOTION_CHANGE_EVENT = 'cv-reduced-motion-change';

/** Type guard for a valid reduced-motion preference. */
export function isReducedMotionPreference(
  value: unknown
): value is ReducedMotionPreference {
  return value === 'system' || value === 'reduce' || value === 'full';
}

/** Reads the persisted preference, or the default when none/invalid. */
export function readReducedMotionPreference(): ReducedMotionPreference {
  try {
    const raw = window.localStorage.getItem(REDUCED_MOTION_STORAGE_KEY);
    if (raw) {
      const parsed = safeJSONParse<ReducedMotionPreference | null>(raw, null);
      if (isReducedMotionPreference(parsed)) return parsed;
      if (isReducedMotionPreference(raw)) return raw;
    }
  } catch {
    // localStorage blocked — fall through to the default.
  }
  return DEFAULT_REDUCED_MOTION;
}

/** Whether the OS currently requests reduced motion. */
export function prefersReducedMotionOS(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Resolves a preference + the current OS setting into a single boolean:
 * should motion be reduced right now?
 */
export function resolveReducedMotion(
  preference: ReducedMotionPreference
): boolean {
  if (preference === 'reduce') return true;
  if (preference === 'full') return false;
  return prefersReducedMotionOS();
}

/**
 * Applies the reduced-motion preference to the document element.
 *
 * Only an explicit override writes the attribute; `system` removes it so the
 * bare `@media (prefers-reduced-motion: reduce)` rules in `index.css` remain the
 * single source of truth for the OS-driven case (no double application).
 */
export function applyReducedMotion(preference: ReducedMotionPreference): void {
  const root = document.documentElement;
  if (preference === 'reduce') {
    root.setAttribute('data-reduced-motion', 'reduce');
  } else if (preference === 'full') {
    root.setAttribute('data-reduced-motion', 'full');
  } else {
    root.removeAttribute('data-reduced-motion');
  }
}
