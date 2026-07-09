import { useCallback, useEffect, useState } from 'react';

import { syncStorage } from '@/auth';
import {
  hydrateFromSync,
  isThemeModePreference,
  logger,
  readThemeModePreference,
  safeJSONParse,
  sanitizeHexColor,
  THEME_MODE_CHANGE_EVENT,
  THEME_MODE_STORAGE_KEY,
  type ThemeModePreference
} from '@utils';

// Types
export interface UseThemeResult {
  lightSquare: string;
  darkSquare: string;
  setLightSquare: (color: string) => void;
  setDarkSquare: (color: string) => void;
}

export function useTheme({
  initialLight = '#f0d9b5',
  initialDark = '#b58863'
} = {}): UseThemeResult {
  const [lightSquare, setLightSquare] = useState(initialLight);
  const [darkSquare, setDarkSquare] = useState(initialDark);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadSavedTheme = async () => {
      type SavedTheme = { light: string; dark: string };
      try {
        let saved: SavedTheme | null = null;

        const cloud = await syncStorage.get('chess-theme');
        if (cloud && typeof cloud.value === 'string') {
          saved = safeJSONParse<SavedTheme | null>(cloud.value, null);
        }
        if (!saved) {
          const local = window.localStorage.getItem('chess-theme');
          if (local) saved = safeJSONParse<SavedTheme | null>(local, null);
        }

        if (saved) {
          setLightSquare(sanitizeHexColor(saved.light, initialLight));
          setDarkSquare(sanitizeHexColor(saved.dark, initialDark));
        }
      } catch (err) {
        logger.error('Failed to load theme:', err);
      } finally {
        setIsHydrated(true);
      }
    };

    loadSavedTheme();
  }, [initialLight, initialDark]);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      const data = JSON.stringify({ light: lightSquare, dark: darkSquare });
      try {
        window.localStorage.setItem('chess-theme', data);
        void syncStorage.set('chess-theme', data);
      } catch (err) {
        logger.error('Failed to save theme:', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [lightSquare, darkSquare, isHydrated]);

  return { lightSquare, darkSquare, setLightSquare, setDarkSquare };
}

export function useSyncedBoardColors(
  setLightSquare: (color: string) => void,
  setDarkSquare: (color: string) => void
): void {
  useEffect(() => {
    const readFromStorage = () => {
      const light = window.localStorage.getItem('chess-light-square');
      const dark = window.localStorage.getItem('chess-dark-square');
      if (light !== null) {
        setLightSquare(
          sanitizeHexColor(safeJSONParse(light, '#f0d9b5'), '#f0d9b5')
        );
      }
      if (dark !== null) {
        setDarkSquare(
          sanitizeHexColor(safeJSONParse(dark, '#b58863'), '#b58863')
        );
      }
    };

    readFromStorage();
    window.addEventListener('storage', readFromStorage);

    const onVisible = () => {
      if (document.visibilityState === 'visible') readFromStorage();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('storage', readFromStorage);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [setLightSquare, setDarkSquare]);
}

export function useThemeMode(): [
  ThemeModePreference,
  (next: ThemeModePreference) => void
] {
  const [preference, setPreference] = useState<ThemeModePreference>(() =>
    readThemeModePreference()
  );

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
      const value = JSON.stringify(next);
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, value);
      void syncStorage.set(THEME_MODE_STORAGE_KEY, value);
      window.dispatchEvent(new Event(THEME_MODE_CHANGE_EVENT));
    } catch (err) {
      logger.error('Failed to save theme mode:', err);
    }
  }, []);

  return [preference, select];
}

export function useThemeModeSync(): void {
  useEffect(() => {
    let cancelled = false;
    void hydrateFromSync(
      THEME_MODE_STORAGE_KEY,
      (decoded) => {
        if (!isThemeModePreference(decoded)) return;
        const current = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
        const next = JSON.stringify(decoded);
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

// Presets
const CUSTOM_THEME_PRESETS_KEY = 'custom-theme-presets';

export interface ThemePreset {
  id: number;
  name: string;
  light: string;
  dark: string;
  timestamp: number;
}

export interface UseThemePresetsResult {
  customPresets: ThemePreset[];
  savePreset: (name: string, light: string, dark: string) => void;
  deletePreset: (id: number) => void;
  updatePreset: (
    id: number,
    updates: Partial<Pick<ThemePreset, 'name' | 'light' | 'dark'>>
  ) => void;
}

export function useThemePresets(): UseThemePresetsResult {
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const local = window.localStorage.getItem(CUSTOM_THEME_PRESETS_KEY);
        const localPresets = local
          ? safeJSONParse<ThemePreset[]>(local, [])
          : [];
        if (Array.isArray(localPresets)) setCustomPresets(localPresets);

        const cloud = await syncStorage.get(CUSTOM_THEME_PRESETS_KEY);
        if (cloud && typeof cloud.value === 'string') {
          const cloudPresets = safeJSONParse<ThemePreset[]>(cloud.value, []);
          if (
            Array.isArray(cloudPresets) &&
            JSON.stringify(cloudPresets) !== JSON.stringify(localPresets)
          ) {
            setCustomPresets(cloudPresets);
            window.localStorage.setItem(
              CUSTOM_THEME_PRESETS_KEY,
              JSON.stringify(cloudPresets)
            );
          }
        }
      } catch (err) {
        logger.error('Failed to load theme presets:', err);
      }
    };

    load();
  }, []);

  const persist = (presets: ThemePreset[]) => {
    setCustomPresets(presets);
    const data = JSON.stringify(presets);
    try {
      window.localStorage.setItem(CUSTOM_THEME_PRESETS_KEY, data);
      void syncStorage.set(CUSTOM_THEME_PRESETS_KEY, data);
    } catch (err) {
      logger.error('Failed to save theme presets:', err);
    }
  };

  const savePreset = (name: string, light: string, dark: string) => {
    persist([
      ...customPresets,
      { id: Date.now(), name, light, dark, timestamp: Date.now() }
    ]);
  };

  const updatePreset = (
    id: number,
    updates: Partial<Pick<ThemePreset, 'name' | 'light' | 'dark'>>
  ) => {
    persist(
      customPresets.map((preset) =>
        preset.id === id ? { ...preset, ...updates } : preset
      )
    );
  };

  const deletePreset = (id: number) => {
    persist(customPresets.filter((preset) => preset.id !== id));
  };

  return { customPresets, savePreset, updatePreset, deletePreset };
}
