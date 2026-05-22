import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';
import { logger } from '@utils/logger';
import { safeJSONParse, sanitizeHexColor } from '@utils/validation';

export interface ThemeHistoryItem {
  id: number;
  name: string;
  light: string;
  dark: string;
  timestamp: number;
}

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
  importTheme: (themeData: {
    light: string;
    dark: string;
    name?: string;
  }) => void;
  getContrastRatio: (color1: string, color2: string) => string;
  hasGoodContrast: () => boolean;
  generateComplementary: (hex: string) => string;
  adjustBrightness: (hex: string, percent: number) => string;
}

/**
 * Manages board theme colors, presets, and persistence across local and cloud storage.
 *
 * @param options - Configuration options
 * @param options.initialLight - Initial light square color hex
 * @param options.initialDark - Initial dark square color hex
 * @returns State and action handlers for theme management
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

  useEffect(() => {
    /** Loads the active theme from storage. */
    const loadTheme = async () => {
      try {
        if (syncStorage) {
          const result = await syncStorage.get('chess-theme');
          if (result && typeof result.value === 'string') {
            const saved = safeJSONParse<{ light: string; dark: string }>(
              result.value,
              { light: initialLight, dark: initialDark }
            );
            if (saved && typeof saved === 'object') {
              setLightSquare(sanitizeHexColor(saved.light, initialLight));
              setDarkSquare(sanitizeHexColor(saved.dark, initialDark));
              setCurrentTheme('custom');
              return;
            }
          }
        }

        const lightLocal = window.localStorage.getItem('chess-light-square');
        const darkLocal = window.localStorage.getItem('chess-dark-square');

        if (lightLocal || darkLocal) {
          setLightSquare(
            sanitizeHexColor(lightLocal?.replace(/"/g, '') || '', initialLight)
          );
          setDarkSquare(
            sanitizeHexColor(darkLocal?.replace(/"/g, '') || '', initialDark)
          );
          return;
        }

        const localTheme = window.localStorage.getItem('chess-theme');
        if (localTheme) {
          const saved = safeJSONParse<{ light: string; dark: string }>(
            localTheme,
            { light: initialLight, dark: initialDark }
          );
          if (saved && typeof saved === 'object') {
            setLightSquare(sanitizeHexColor(saved.light, initialLight));
            setDarkSquare(sanitizeHexColor(saved.dark, initialDark));
            setCurrentTheme('custom');
          }
        }
      } catch (err) {
        logger.error('Failed to load theme:', err);
      }
    };

    /** Loads theme change history from storage. */
    const loadHistory = () => {
      try {
        const historyData = window.localStorage.getItem('theme-history');
        if (historyData) {
          const parsed = safeJSONParse<ThemeHistoryItem[]>(historyData, []);
          if (Array.isArray(parsed)) {
            setThemeHistory(parsed);
          }
        }
      } catch (err) {
        logger.error('Failed to load theme history:', err);
      }
    };

    loadTheme();
    loadHistory();

    /** Updates state when localStorage changes in another tab. */
    const handleStorageChange = () => {
      const light = window.localStorage.getItem('chess-light-square');
      const dark = window.localStorage.getItem('chess-dark-square');

      if (light) {
        setLightSquare(sanitizeHexColor(light.replace(/"/g, ''), initialLight));
      }
      if (dark) {
        setDarkSquare(sanitizeHexColor(dark.replace(/"/g, ''), initialDark));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialLight, initialDark]);

  useEffect(() => {
    /** Persists the current theme to storage. */
    const saveTheme = async () => {
      const themeData = {
        light: lightSquare,
        dark: darkSquare,
        name: currentTheme,
        timestamp: Date.now()
      };

      const jsonData = JSON.stringify(themeData);

      try {
        window.localStorage.setItem('chess-theme', jsonData);

        if (syncStorage) {
          await syncStorage.set('chess-theme', jsonData);
        }
      } catch (err) {
        logger.error('Failed to save theme:', err);
      }
    };

    const timeoutId = setTimeout(saveTheme, 500);
    return () => clearTimeout(timeoutId);
  }, [lightSquare, darkSquare, currentTheme]);

  /**
   * Applies a named preset theme and records it in history.
   *
   * @param themeKey - Theme identifier
   * @param themeData - Color configuration
   */
  const applyTheme = useCallback(
    (
      themeKey: string,
      themeData: { name?: string; light: string; dark: string }
    ) => {
      setLightSquare(themeData.light);
      setDarkSquare(themeData.dark);
      setCurrentTheme(themeKey);

      const newHistoryItem: ThemeHistoryItem = {
        id: Date.now(),
        name: themeData.name || themeKey,
        light: themeData.light,
        dark: themeData.dark,
        timestamp: Date.now()
      };

      setThemeHistory((prev) => {
        const updatedHistory = [
          newHistoryItem,
          ...prev.filter(
            (h) => h.light !== themeData.light || h.dark !== themeData.dark
          )
        ].slice(0, 10);
        try {
          window.localStorage.setItem(
            'theme-history',
            JSON.stringify(updatedHistory)
          );
        } catch (err) {
          logger.error('Failed to save theme history:', err);
        }
        return updatedHistory;
      });
    },
    []
  );

  /**
   * Applies custom colors and records the theme in history.
   *
   * @param light - Light square hex color
   * @param dark - Dark square hex color
   * @param name - Display name for history
   */
  const applyCustomTheme = useCallback(
    (light: string, dark: string, name = 'Custom') => {
      setLightSquare(light);
      setDarkSquare(dark);
      setCurrentTheme(name);

      const newHistoryItem: ThemeHistoryItem = {
        id: Date.now(),
        name,
        light,
        dark,
        timestamp: Date.now()
      };

      setThemeHistory((prev) => {
        const updatedHistory = [
          newHistoryItem,
          ...prev.filter((h) => h.light !== light || h.dark !== dark)
        ].slice(0, 10);
        try {
          window.localStorage.setItem(
            'theme-history',
            JSON.stringify(updatedHistory)
          );
        } catch (err) {
          logger.error('Failed to save theme history:', err);
        }
        return updatedHistory;
      });
    },
    []
  );

  /**
   * Resets the board colors to the default brown theme.
   */
  const resetTheme = useCallback(() => {
    setLightSquare(initialLight);
    setDarkSquare(initialDark);
    setCurrentTheme('brown');
  }, [initialLight, initialDark]);

  /**
   * Calculates WCAG contrast ratio between two hex colors.
   *
   * @param color1 - First color hex
   * @param color2 - Second color hex
   * @returns Formatted ratio string (e.g. "4.50")
   */
  const getContrastRatio = useCallback((color1: string, color2: string) => {
    /** Calculates relative luminance for a hex color. */
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = ((rgb >> 16) & 0xff) / 255;
      const g = ((rgb >> 8) & 0xff) / 255;
      const b = (rgb & 0xff) / 255;

      const transformed = [r, g, b].map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );

      const rs = transformed[0] ?? 0;
      const gs = transformed[1] ?? 0;
      const bs = transformed[2] ?? 0;

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio.toFixed(2);
  }, []);

  /**
   * Checks if current colors provide sufficient contrast for accessibility.
   *
   * @returns True if contrast ratio >= 1.5
   */
  const hasGoodContrast = useCallback(() => {
    const ratio = parseFloat(getContrastRatio(lightSquare, darkSquare));
    return ratio >= 1.5;
  }, [lightSquare, darkSquare, getContrastRatio]);

  /**
   * Generates the complementary (inverted) color.
   *
   * @param hex - Source color hex
   * @returns Inverted color hex
   */
  const generateComplementary = useCallback((hex: string) => {
    const num = parseInt(hex.slice(1), 16);
    const r = 255 - ((num >> 16) & 0xff);
    const g = 255 - ((num >> 8) & 0xff);
    const b = 255 - (num & 0xff);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }, []);

  /**
   * Adjusts the brightness of a color.
   *
   * @param hex - Source color hex
   * @param percent - Adjustment percentage (-100 to 100)
   * @returns Adjusted color hex
   */
  const adjustBrightness = useCallback((hex: string, percent: number) => {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0xff) + amt));
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }, []);

  /**
   * Clears the theme history list.
   */
  const clearThemeHistory = useCallback(() => {
    setThemeHistory([]);
    try {
      window.localStorage.removeItem('theme-history');
    } catch (err) {
      logger.error('Failed to clear theme history:', err);
    }
  }, []);

  /**
   * Exports the current theme as a data object.
   *
   * @returns Serializable theme object
   */
  const exportTheme = useCallback(() => {
    return {
      name: currentTheme,
      light: lightSquare,
      dark: darkSquare,
      contrastRatio: getContrastRatio(lightSquare, darkSquare),
      timestamp: Date.now()
    };
  }, [currentTheme, lightSquare, darkSquare, getContrastRatio]);

  /**
   * Imports and applies a theme object.
   *
   * @param themeData - The theme to import
   */
  const importTheme = useCallback(
    (themeData: { light: string; dark: string; name?: string }) => {
      if (!themeData || !themeData.light || !themeData.dark) {
        throw new Error('Invalid theme data');
      }

      applyCustomTheme(
        themeData.light,
        themeData.dark,
        themeData.name || 'Imported'
      );
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
      lightSquare, darkSquare, currentTheme, themeHistory,
      applyTheme, applyCustomTheme, resetTheme, clearThemeHistory,
      exportTheme, importTheme,
      getContrastRatio, hasGoodContrast, generateComplementary, adjustBrightness
    ]
  );
}

export default useTheme;
