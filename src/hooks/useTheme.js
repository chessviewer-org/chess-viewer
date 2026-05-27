import { useCallback, useEffect, useState } from 'react';

import { logger } from '@/utils/logger';
import {
  getStoredString,
  getStoredValue,
  safeJSONParse,
  sanitizeHexColor
} from '@/utils/validation';

/**
 * Manages board theme colors, presets, and persistence.
 *
 * @param {Object} [options={}]
 * @param {string} [options.initialLight='#f0d9b5'] - Initial light square color
 * @param {string} [options.initialDark='#b58863'] - Initial dark square color
 * @returns {Object} Theme state and action handlers
 */
export function useTheme({
  initialLight = '#f0d9b5',
  initialDark = '#b58863'
} = {}) {
  const [lightSquare, setLightSquare] = useState(initialLight);
  const [darkSquare, setDarkSquare] = useState(initialDark);
  const [currentTheme, setCurrentTheme] = useState('custom');
  const [themeHistory, setThemeHistory] = useState([]);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        if (window.storage && typeof window.storage.get === 'function') {
          const result = await window.storage.get('chess-theme');
          if (result && typeof result.value === 'string') {
            const saved = safeJSONParse(result.value, null);
            if (saved && typeof saved === 'object') {
              setLightSquare(sanitizeHexColor(saved.light, initialLight));
              setDarkSquare(sanitizeHexColor(saved.dark, initialDark));
              setCurrentTheme('custom');
              return;
            }
          }
        }

        const lightLocal = getStoredString('chess-light-square', '');
        const darkLocal = getStoredString('chess-dark-square', '');

        if (lightLocal || darkLocal) {
          setLightSquare(sanitizeHexColor(lightLocal, initialLight));
          setDarkSquare(sanitizeHexColor(darkLocal, initialDark));
          return;
        }

        const saved = getStoredValue('chess-theme', null);
        if (saved && typeof saved === 'object') {
          setLightSquare(sanitizeHexColor(saved.light, initialLight));
          setDarkSquare(sanitizeHexColor(saved.dark, initialDark));
          setCurrentTheme('custom');
        }
      } catch (err) {
        logger.error('Failed to load theme:', err);
      }
    };

    const loadHistory = () => {
      try {
        const parsed = getStoredValue('theme-history', null);
        if (Array.isArray(parsed)) {
          setThemeHistory(parsed);
        }
      } catch (err) {
        logger.error('Failed to load theme history:', err);
      }
    };

    loadTheme();
    loadHistory();

    const handleStorageChange = () => {
      const light = getStoredString('chess-light-square', '');
      const dark = getStoredString('chess-dark-square', '');

      if (light) {
        setLightSquare(sanitizeHexColor(light, initialLight));
      }
      if (dark) {
        setDarkSquare(sanitizeHexColor(dark, initialDark));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initialLight, initialDark]);

  useEffect(() => {
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

        if (window.storage && typeof window.storage.set === 'function') {
          await window.storage.set('chess-theme', jsonData);
        }
      } catch (err) {
        logger.error('Failed to save theme:', err);
      }
    };

    const timeoutId = setTimeout(saveTheme, 500);
    return () => clearTimeout(timeoutId);
  }, [lightSquare, darkSquare, currentTheme]);

  /**
   * Apply a named preset theme.
   *
   * @param {string} themeKey - Theme identifier key
   * @param {{ name?: string, light: string, dark: string }} themeData - Theme color data
   */
  const applyTheme = useCallback((themeKey, themeData) => {
    setLightSquare(themeData.light);
    setDarkSquare(themeData.dark);
    setCurrentTheme(themeKey);

    const newHistoryItem = {
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
  }, []);

  /**
   * Apply custom light and dark square colors.
   *
   * @param {string} light - Light square hex color
   * @param {string} dark - Dark square hex color
   * @param {string} [name='Custom'] - Theme name for history
   */
  const applyCustomTheme = useCallback((light, dark, name = 'Custom') => {
    setLightSquare(light);
    setDarkSquare(dark);
    setCurrentTheme(name);

    const newHistoryItem = {
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
  }, []);

  /**
   * Reset board colors to the initial (default) values.
   */
  const resetTheme = useCallback(() => {
    setLightSquare(initialLight);
    setDarkSquare(initialDark);
    setCurrentTheme('brown');
  }, [initialLight, initialDark]);

  /**
   * Calculate WCAG contrast ratio between two hex colors.
   *
   * @param {string} color1 - First hex color
   * @param {string} color2 - Second hex color
   * @returns {string} Contrast ratio formatted to two decimal places
   */
  const getContrastRatio = useCallback((color1, color2) => {
    const getLuminance = (hex) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = ((rgb >> 16) & 0xff) / 255;
      const g = ((rgb >> 8) & 0xff) / 255;
      const b = (rgb & 0xff) / 255;

      const [rs, gs, bs] = [r, g, b].map((c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio.toFixed(2);
  }, []);

  /**
   * Check whether the current light/dark square colors meet minimum contrast.
   *
   * @returns {boolean} True if contrast ratio is at least 1.5
   */
  const hasGoodContrast = useCallback(() => {
    const ratio = parseFloat(getContrastRatio(lightSquare, darkSquare));
    return ratio >= 1.5;
  }, [lightSquare, darkSquare, getContrastRatio]);

  /**
   * Generate the complementary (inverted) color of a hex color.
   *
   * @param {string} hex - Input hex color
   * @returns {string} Complementary hex color
   */
  const generateComplementary = useCallback((hex) => {
    const num = parseInt(hex.slice(1), 16);
    const r = 255 - ((num >> 16) & 0xff);
    const g = 255 - ((num >> 8) & 0xff);
    const b = 255 - (num & 0xff);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }, []);

  /**
   * Lighten or darken a hex color by a percentage.
   *
   * @param {string} hex - Input hex color
   * @param {number} percent - Percentage to adjust (-100 to 100)
   * @returns {string} Adjusted hex color
   */
  const adjustBrightness = useCallback((hex, percent) => {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0xff) + amt));
    return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }, []);

  /**
   * Clear the theme change history.
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
   * Export the current theme as a serializable object.
   *
   * @returns {{ name: string, light: string, dark: string, contrastRatio: string, timestamp: number }}
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
   * Import and apply a theme from a serialized theme object.
   *
   * @param {{ light: string, dark: string, name?: string }} themeData - Theme to import
   * @throws {Error} If themeData is missing required color fields
   */
  const importTheme = useCallback(
    (themeData) => {
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

  return {
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
  };
}

/**
 * Loads, saves, and manages named custom theme presets.
 *
 * @returns {{ customPresets: Array, savePreset: function, deletePreset: function, loadPreset: function }}
 */
export function useThemePresets() {
  const [customPresets, setCustomPresets] = useState([]);

  useEffect(() => {
    try {
      const parsed = getStoredValue('custom-theme-presets', null);
      if (Array.isArray(parsed)) {
        setCustomPresets(parsed);
      }
    } catch (err) {
      logger.error('Failed to load custom presets:', err);
    }
  }, []);

  /**
   * Save a new custom color preset.
   *
   * @param {string} name - Preset display name
   * @param {string} light - Light square hex color
   * @param {string} dark - Dark square hex color
   */
  const savePreset = useCallback(
    (name, light, dark) => {
      const newPreset = {
        id: Date.now(),
        name,
        light,
        dark,
        timestamp: Date.now()
      };

      const updated = [...customPresets, newPreset];
      setCustomPresets(updated);

      try {
        window.localStorage.setItem(
          'custom-theme-presets',
          JSON.stringify(updated)
        );
      } catch (err) {
        logger.error('Failed to save preset:', err);
      }
    },
    [customPresets]
  );

  /**
   * Delete a custom preset by ID.
   *
   * @param {number} id - Preset ID to delete
   */
  const deletePreset = useCallback(
    (id) => {
      const updated = customPresets.filter((p) => p.id !== id);
      setCustomPresets(updated);

      try {
        window.localStorage.setItem(
          'custom-theme-presets',
          JSON.stringify(updated)
        );
      } catch (err) {
        logger.error('Failed to delete preset:', err);
      }
    },
    [customPresets]
  );

  /**
   * Remove all custom theme presets.
   */
  const clearPresets = useCallback(() => {
    setCustomPresets([]);
    try {
      window.localStorage.removeItem('custom-theme-presets');
    } catch (err) {
      logger.error('Failed to clear presets:', err);
    }
  }, []);

  return {
    customPresets,
    savePreset,
    deletePreset,
    clearPresets
  };
}

export default useTheme;
