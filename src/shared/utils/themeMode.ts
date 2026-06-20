/**
 * Light/dark THEME-MODE persistence helpers.
 *
 * This is the site UI mode (`data-theme` = 'light' | 'dark'), distinct from the
 * board-square colours (`useThemePersistence`).
 *
 * Three user choices exist:
 *   - 'light' / 'dark' — a manual override that pins the site, persisted so it
 *     survives reloads and syncs across signed-in devices.
 *   - 'system'         — an EXPLICIT choice to follow the OS `prefers-color-scheme`
 *     and track it live. It is STORED (as the literal 'system'), not the absence
 *     of a key.
 *
 * Default (no stored preference at all): DARK. A brand-new user sees dark, NOT
 * the OS setting; 'system' must be chosen explicitly to follow the OS.
 *
 * Persistence pattern: localStorage is the synchronous source of truth,
 * `syncStorage` is best-effort, and an in-app event lets a change on the
 * Appearance page reach App immediately.
 */

import { safeJSONParse } from './validation';

/** The two concrete site themes applied to `data-theme`. */
export type ThemeMode = 'light' | 'dark';

/** The user-facing preference, including 'system' (explicitly follow OS). */
export type ThemeModePreference = ThemeMode | 'system';

/**
 * The effective preference when nothing is stored. A fresh user (no
 * `cv_theme_mode` key, no legacy value) gets DARK — NOT the OS setting.
 */
export const DEFAULT_THEME_MODE: ThemeModePreference = 'dark';

/**
 * localStorage key for the mode preference (synced-key convention).
 * May hold 'light' | 'dark' | 'system'. Absent ⇒ {@link DEFAULT_THEME_MODE}.
 */
export const THEME_MODE_STORAGE_KEY = 'cv_theme_mode';

/** Legacy key the mode was once (incorrectly) co-stored under. Read-only fallback. */
const LEGACY_THEME_KEY = 'chess-theme';

/** In-app event so a live mode change (Appearance page) reaches App at once. */
export const THEME_MODE_CHANGE_EVENT = 'cv-theme-mode-change';

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

/** Type guard for the full preference set, including the explicit 'system'. */
export function isThemeModePreference(
  value: unknown
): value is ThemeModePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Reads the persisted preference, or `null` when none exists. The stored value
 * may be 'light' | 'dark' | 'system' (system is now an explicit choice).
 *
 * Falls back to a legacy plain-string `chess-theme` value for back-compat, but
 * only for 'light' | 'dark' (the legacy key never held 'system'); the JSON
 * object shape that `useThemePersistence` stores there is NOT a mode.
 *
 * @returns The stored preference, or `null` when nothing is stored
 */
export function readStoredThemeMode(): ThemeModePreference | null {
  try {
    const raw = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (raw) {
      const parsed = safeJSONParse<ThemeModePreference | null>(raw, null);
      if (isThemeModePreference(parsed)) return parsed;
      // Tolerate an un-quoted write of this same key.
      if (isThemeModePreference(raw)) return raw;
    }

    // Back-compat: the mode used to share `chess-theme` as a plain string. Only
    // honour the 'light'/'dark' string form (it never held 'system'); the
    // board-colour JSON object is not a mode.
    const legacy = window.localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy && isThemeMode(legacy)) return legacy;
  } catch {
    // localStorage blocked — fall through to the default.
  }
  return null;
}

/** Resolves the OS preference into a concrete mode. */
export function systemThemeMode(): ThemeMode {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * The effective preference: the stored choice, or {@link DEFAULT_THEME_MODE}
 * ('dark') when nothing is stored.
 *
 * @returns 'light' | 'dark' | 'system'
 */
export function readThemeModePreference(): ThemeModePreference {
  return readStoredThemeMode() ?? DEFAULT_THEME_MODE;
}

/**
 * True when the app is currently following the OS, i.e. the stored preference
 * is the explicit literal 'system'. (Absence of a key now means DARK, not OS.)
 *
 * @returns Whether the OS setting should be tracked live
 */
export function isFollowingSystem(): boolean {
  return readStoredThemeMode() === 'system';
}

/**
 * Resolves a preference to the concrete mode to apply to `data-theme`.
 *
 * @param preference - The user choice
 * @returns The concrete 'light' | 'dark'
 */
export function resolveThemeMode(preference: ThemeModePreference): ThemeMode {
  return preference === 'system' ? systemThemeMode() : preference;
}
