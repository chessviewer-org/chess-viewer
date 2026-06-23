import { useEffect } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';

import { logger, safeJSONParse, sanitizeHexColor } from '@utils';
import type { ThemeHistoryItem } from './types';

/** Options for `useThemePersistence`. */
interface UseThemePersistenceOptions {
  initialLight: string;
  initialDark: string;
  lightSquare: string;
  darkSquare: string;
  currentTheme: string;
  setLightSquare: (v: string) => void;
  setDarkSquare: (v: string) => void;
  setCurrentTheme: (v: string) => void;
  setThemeHistory: (v: ThemeHistoryItem[]) => void;
}

/**
 * Hydrates theme colors and history from `localStorage`/Supabase on mount, and
 * persists changes back on every color or theme name update.
 *
 * Listens for the `storage` event so tabs stay in sync.
 */
export function useThemePersistence({
  initialLight,
  initialDark,
  lightSquare,
  darkSquare,
  currentTheme,
  setLightSquare,
  setDarkSquare,
  setCurrentTheme,
  setThemeHistory
}: UseThemePersistenceOptions) {
  useEffect(() => {
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
            {
              light: initialLight,
              dark: initialDark
            }
          );
          if (saved && typeof saved === 'object') {
            setLightSquare(sanitizeHexColor(saved.light, initialLight));
            setDarkSquare(sanitizeHexColor(saved.dark, initialDark));
            setCurrentTheme('custom');
          }
        }
      } catch (err: unknown) {
        logger.error('Failed to load theme:', err);
      }
    };

    const loadHistory = () => {
      try {
        const historyData = window.localStorage.getItem('theme-history');
        if (historyData) {
          const parsed = safeJSONParse<ThemeHistoryItem[]>(historyData, []);
          if (Array.isArray(parsed)) setThemeHistory(parsed);
        }
      } catch (err: unknown) {
        logger.error('Failed to load theme history:', err);
      }
    };

    loadTheme();
    loadHistory();

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
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [
    initialLight,
    initialDark,
    setLightSquare,
    setDarkSquare,
    setCurrentTheme,
    setThemeHistory
  ]);

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
        if (syncStorage) await syncStorage.set('chess-theme', jsonData);
      } catch (err: unknown) {
        logger.error('Failed to save theme:', err);
      }
    };

    const timeoutId = setTimeout(saveTheme, 500);
    return () => clearTimeout(timeoutId);
  }, [lightSquare, darkSquare, currentTheme]);
}
