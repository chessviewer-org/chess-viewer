import React, { useCallback, useMemo, useState } from 'react';

import { logger } from '@utils/logger';
import {
  adjustBrightness,
  generateComplementary,
  getContrastRatio
} from './theme/themeColorMath';
import type { ThemeHistoryItem } from './theme/types';
import { useThemePersistence } from './theme/useThemePersistence';

export type { ThemeHistoryItem };

/** Return type of `useTheme` — exposes the current colors, history, and all theme manipulation actions. */
export interface UseThemeResult {
  lightSquare: string;
  darkSquare: string;
  currentTheme: string;
  themeHistory: ThemeHistoryItem[];
  setLightSquare: React.Dispatch<React.SetStateAction<string>>;
  setDarkSquare: React.Dispatch<React.SetStateAction<string>>;
  applyTheme: (
    themeKey: string,
    themeData: { name?: string; light: string; dark: string }
  ) => void;
  applyCustomTheme: (light: string, dark: string, name?: string) => void;
  resetTheme: () => void;
  clearThemeHistory: () => void;
  exportTheme: () => {
    name: string;
    light: string;
    dark: string;
    contrastRatio: string;
    timestamp: number;
  };
  importTheme: (themeData: { light: string; dark: string; name?: string }) => void;
  getContrastRatio: (color1: string, color2: string) => string;
  hasGoodContrast: () => boolean;
  generateComplementary: (hex: string) => string;
  adjustBrightness: (hex: string, percent: number) => string;
}

function pushHistory(
  setThemeHistory: React.Dispatch<React.SetStateAction<ThemeHistoryItem[]>>,
  entry: ThemeHistoryItem
) {
  setThemeHistory((prev) => {
    const updated = [
      entry,
      ...prev.filter((h) => h.light !== entry.light || h.dark !== entry.dark)
    ].slice(0, 10);
    try {
      window.localStorage.setItem('theme-history', JSON.stringify(updated));
    } catch (err) {
      logger.error('Failed to save theme history:', err);
    }
    return updated;
  });
}

/**
 * Manages board theme colors with persistence, history, and utility actions.
 *
 * Persists `lightSquare` and `darkSquare` to `localStorage` and exposes helpers
 * for applying presets, generating complementary colors, and exporting/importing themes.
 *
 * @param initialLight - Initial light square hex color
 * @param initialDark - Initial dark square hex color
 * @returns Theme state and all color manipulation actions
 */
export function useTheme({
  initialLight = '#f0d9b5',
  initialDark = '#b58863'
}: {
  initialLight?: string;
  initialDark?: string;
} = {}): UseThemeResult {
  const [lightSquare, setLightSquare] = useState(initialLight);
  const [darkSquare, setDarkSquare] = useState(initialDark);
  const [currentTheme, setCurrentTheme] = useState('custom');
  const [themeHistory, setThemeHistory] = useState<ThemeHistoryItem[]>([]);

  useThemePersistence({
    initialLight,
    initialDark,
    lightSquare,
    darkSquare,
    currentTheme,
    setLightSquare,
    setDarkSquare,
    setCurrentTheme,
    setThemeHistory
  });

  const applyTheme = useCallback(
    (
      themeKey: string,
      themeData: { name?: string; light: string; dark: string }
    ) => {
      setLightSquare(themeData.light);
      setDarkSquare(themeData.dark);
      setCurrentTheme(themeKey);
      pushHistory(setThemeHistory, {
        id: Date.now(),
        name: themeData.name || themeKey,
        light: themeData.light,
        dark: themeData.dark,
        timestamp: Date.now()
      });
    },
    []
  );

  const applyCustomTheme = useCallback(
    (light: string, dark: string, name = 'Custom') => {
      setLightSquare(light);
      setDarkSquare(dark);
      setCurrentTheme(name);
      pushHistory(setThemeHistory, {
        id: Date.now(),
        name,
        light,
        dark,
        timestamp: Date.now()
      });
    },
    []
  );

  const resetTheme = useCallback(() => {
    setLightSquare(initialLight);
    setDarkSquare(initialDark);
    setCurrentTheme('brown');
  }, [initialLight, initialDark]);

  const hasGoodContrast = useCallback(() => {
    return parseFloat(getContrastRatio(lightSquare, darkSquare)) >= 1.5;
  }, [lightSquare, darkSquare]);

  const clearThemeHistory = useCallback(() => {
    setThemeHistory([]);
    try {
      window.localStorage.removeItem('theme-history');
    } catch (err) {
      logger.error('Failed to clear theme history:', err);
    }
  }, []);

  const exportTheme = useCallback(
    () => ({
      name: currentTheme,
      light: lightSquare,
      dark: darkSquare,
      contrastRatio: getContrastRatio(lightSquare, darkSquare),
      timestamp: Date.now()
    }),
    [currentTheme, lightSquare, darkSquare]
  );

  const importTheme = useCallback(
    (themeData: { light: string; dark: string; name?: string }) => {
      if (!themeData || !themeData.light || !themeData.dark) {
        throw new Error('Invalid theme data');
      }
      applyCustomTheme(themeData.light, themeData.dark, themeData.name || 'Imported');
    },
    [applyCustomTheme]
  );

  return useMemo(
    () => ({
      lightSquare,
      darkSquare,
      currentTheme,
      themeHistory,
      setLightSquare,
      setDarkSquare,
      applyTheme,
      applyCustomTheme,
      resetTheme,
      clearThemeHistory,
      exportTheme,
      importTheme,
      getContrastRatio,
      hasGoodContrast,
      generateComplementary,
      adjustBrightness
    }),
    [
      lightSquare,
      darkSquare,
      currentTheme,
      themeHistory,
      applyTheme,
      applyCustomTheme,
      resetTheme,
      clearThemeHistory,
      exportTheme,
      importTheme,
      hasGoodContrast
    ]
  );
}
