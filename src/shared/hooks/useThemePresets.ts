import { useCallback, useEffect, useMemo, useState } from 'react';

import { logger } from '@utils/logger';
import { safeJSONParse } from '@utils/validation';

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
  replacePresets: (presets: ThemePreset[]) => void;
  clearPresets: () => void;
}

/**
 * Hook for managing user-created custom theme presets.
 *
 * @returns State and operations for custom presets
 */
export function useThemePresets(): UseThemePresetsResult {
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CUSTOM_THEME_PRESETS_KEY);
      if (saved) {
        const parsed = safeJSONParse<ThemePreset[]>(saved, []);
        if (Array.isArray(parsed)) {
          setCustomPresets(parsed);
        }
      }
    } catch (err) {
      logger.error('Failed to load custom presets:', err);
    }
  }, []);

  const persistPresets = useCallback((presets: ThemePreset[]) => {
    try {
      window.localStorage.setItem(CUSTOM_THEME_PRESETS_KEY, JSON.stringify(presets));
    } catch (err) {
      logger.error('Failed to persist presets:', err);
    }
  }, []);

  const savePreset = useCallback(
    (name: string, light: string, dark: string) => {
      const newPreset: ThemePreset = {
        id: Date.now(),
        name,
        light,
        dark,
        timestamp: Date.now()
      };

      setCustomPresets((prev) => {
        const updated = [...prev, newPreset];
        persistPresets(updated);
        return updated;
      });
    },
    [persistPresets]
  );

  const updatePreset = useCallback(
    (
      id: number,
      updates: Partial<Pick<ThemePreset, 'name' | 'light' | 'dark'>>
    ) => {
      setCustomPresets((prev) => {
        const updated = prev.map((preset) =>
          preset.id === id
            ? {
                ...preset,
                name: updates.name ?? preset.name,
                light: updates.light ?? preset.light,
                dark: updates.dark ?? preset.dark
              }
            : preset
        );
        persistPresets(updated);
        return updated;
      });
    },
    [persistPresets]
  );

  const replacePresets = useCallback(
    (presets: ThemePreset[]) => {
      setCustomPresets(presets);
      persistPresets(presets);
    },
    [persistPresets]
  );

  const deletePreset = useCallback(
    (id: number) => {
      setCustomPresets((prev) => {
        const updated = prev.filter((preset) => preset.id !== id);
        persistPresets(updated);
        return updated;
      });
    },
    [persistPresets]
  );

  const clearPresets = useCallback(() => {
    setCustomPresets([]);
    try {
      window.localStorage.removeItem(CUSTOM_THEME_PRESETS_KEY);
    } catch (err) {
      logger.error('Failed to clear presets:', err);
    }
  }, []);

  return useMemo(
    () => ({
      customPresets,
      savePreset,
      updatePreset,
      replacePresets,
      deletePreset,
      clearPresets
    }),
    [customPresets, savePreset, updatePreset, replacePresets, deletePreset, clearPresets]
  );
}
