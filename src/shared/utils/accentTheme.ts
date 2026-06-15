import {
  type AccentTheme,
  DEFAULT_ACCENT_ID,
  getAccentTheme,
  normalizeAccentId
} from '@constants';

import { safeJSONParse } from './validation';

/**
 * Accent-theme application + persistence helpers.
 *
 * The chosen accent overrides the stylesheet's `--val-accent`/`-hover`/`-muted`
 * by setting those custom properties inline on `document.documentElement`. The
 * correct triple depends on the active `data-theme` (dark vs light), so callers
 * re-apply on every theme flip (App owns `data-theme`, so it drives this).
 *
 * Persistence mirrors `useThemePersistence`: localStorage is the synchronous
 * source of truth and `syncStorage` (E2EE) is best-effort for signed-in users.
 */

/** localStorage key for the chosen accent id (synced-key convention). */
export const ACCENT_STORAGE_KEY = 'cv_accent_theme';

/** In-app event so a live accent change (Appearance page) reaches App at once. */
export const ACCENT_CHANGE_EVENT = 'cv-accent-change';

const VAL_ACCENT = '--val-accent';
const VAL_ACCENT_HOVER = '--val-accent-hover';
const VAL_ACCENT_MUTED = '--val-accent-muted';

/**
 * Applies an accent theme's triple for the given mode to the document root.
 * Selecting the default `gold` clears the overrides so the stylesheet's own
 * (identical) values take over — no stale inline override is left behind.
 *
 * @param theme - The accent theme to apply
 * @param mode - The active site theme ('dark' | 'light')
 */
export function applyAccentVars(
  theme: AccentTheme,
  mode: 'dark' | 'light'
): void {
  const root = document.documentElement;
  if (theme.id === DEFAULT_ACCENT_ID) {
    root.style.removeProperty(VAL_ACCENT);
    root.style.removeProperty(VAL_ACCENT_HOVER);
    root.style.removeProperty(VAL_ACCENT_MUTED);
    return;
  }
  const triple = mode === 'light' ? theme.light : theme.dark;
  root.style.setProperty(VAL_ACCENT, triple.accent);
  root.style.setProperty(VAL_ACCENT_HOVER, triple.hover);
  root.style.setProperty(VAL_ACCENT_MUTED, triple.muted);
}

/**
 * Reads the persisted accent id from localStorage, validated against the known
 * set. Falls back to the default. The stored value may be a bare id or a
 * JSON-encoded string (`useLocalStorage` writes JSON); both are handled without
 * a raw `JSON.parse`.
 *
 * @returns A valid accent id
 */
export function readStoredAccentId(): string {
  if (typeof window === 'undefined') return DEFAULT_ACCENT_ID;
  try {
    const raw = window.localStorage.getItem(ACCENT_STORAGE_KEY);
    if (!raw) return DEFAULT_ACCENT_ID;
    // Accept both a JSON-quoted string and a bare id.
    const parsed = safeJSONParse<string>(raw, raw);
    return normalizeAccentId(parsed);
  } catch {
    return DEFAULT_ACCENT_ID;
  }
}

/** Resolves and applies the stored accent for the given mode in one call. */
export function applyStoredAccent(mode: 'dark' | 'light'): void {
  applyAccentVars(getAccentTheme(readStoredAccentId()), mode);
}
