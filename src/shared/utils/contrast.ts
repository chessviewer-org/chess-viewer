/**
 * Contrast-preference persistence helpers (`data-contrast` = 'normal' | 'high').
 *
 * A high-contrast mode strengthens borders and text against surfaces for
 * readability, applied via a `data-contrast="high"` attribute on the document
 * element that `src/index.css` keys token overrides off. Mirrors the accent /
 * theme-mode pattern: localStorage is the synchronous source of truth,
 * `syncStorage` is best-effort, and an in-app event lets a change on the
 * Appearance page reach App immediately.
 */

import { safeJSONParse } from './validation';

/** The two contrast levels applied to `data-contrast`. */
export type ContrastPreference = 'normal' | 'high';

/** Effective preference when nothing is stored. */
export const DEFAULT_CONTRAST: ContrastPreference = 'normal';

/** localStorage key for the contrast preference (synced-key convention). */
export const CONTRAST_STORAGE_KEY = 'cv_contrast';

/** In-app event so a live change (Appearance page) reaches App at once. */
export const CONTRAST_CHANGE_EVENT = 'cv-contrast-change';

/** Type guard for a valid contrast preference. */
export function isContrastPreference(
  value: unknown
): value is ContrastPreference {
  return value === 'normal' || value === 'high';
}

/** Reads the persisted preference, or the default when none/invalid. */
export function readContrastPreference(): ContrastPreference {
  try {
    const raw = window.localStorage.getItem(CONTRAST_STORAGE_KEY);
    if (raw) {
      const parsed = safeJSONParse<ContrastPreference | null>(raw, null);
      if (isContrastPreference(parsed)) return parsed;
      if (isContrastPreference(raw)) return raw;
    }
  } catch {
    // localStorage blocked — fall through to the default.
  }
  return DEFAULT_CONTRAST;
}

/** Applies the contrast preference to the document element. */
export function applyContrast(preference: ContrastPreference): void {
  const root = document.documentElement;
  if (preference === 'high') {
    root.setAttribute('data-contrast', 'high');
  } else {
    root.removeAttribute('data-contrast');
  }
}
