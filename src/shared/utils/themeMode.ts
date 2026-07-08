import { safeJSONParse } from '@chessviewer-org/chess-viewer';

export type ThemeMode = 'light' | 'dark';

export type ThemeModePreference = ThemeMode | 'system';

const DEFAULT_THEME_MODE: ThemeModePreference = 'dark';

export const THEME_MODE_STORAGE_KEY = 'cv_theme_mode';

const LEGACY_THEME_KEY = 'chess-theme';

export const THEME_MODE_CHANGE_EVENT = 'cv-theme-mode-change';

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function isThemeModePreference(
  value: unknown
): value is ThemeModePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readStoredThemeMode(): ThemeModePreference | null {
  try {
    const raw = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (raw) {
      const parsed = safeJSONParse<ThemeModePreference | null>(raw, null);
      if (isThemeModePreference(parsed)) return parsed;
      if (isThemeModePreference(raw)) return raw;
    }

    const legacy = window.localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy && isThemeMode(legacy)) return legacy;
  } catch {
    return null;
  }
  return null;
}

export function systemThemeMode(): ThemeMode {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function readThemeModePreference(): ThemeModePreference {
  return readStoredThemeMode() ?? DEFAULT_THEME_MODE;
}

export function isFollowingSystem(): boolean {
  return readStoredThemeMode() === 'system';
}

export function resolveThemeMode(preference: ThemeModePreference): ThemeMode {
  return preference === 'system' ? systemThemeMode() : preference;
}
