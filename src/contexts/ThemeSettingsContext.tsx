import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { safeJSONParse } from '@utils/validation';
import { logger } from '@utils/logger';

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export interface ThemeSettings {
  autoApply: boolean;
  showRGB: boolean;
  enableAnimations: boolean;
  showColorNames: boolean;
  enableKeyboardShortcuts: boolean;
  showHexValues: boolean;
  enableSoundEffects: boolean;
  compactMode: boolean;
  showRecentColors: boolean;
  enableColorBlindMode: boolean;
}

export interface ThemeSettingsContextValue {
  settings: ThemeSettings;
  updateSetting: <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => void;
  updateSettings: (newSettings: ThemeSettings) => void;
  resetSettings: () => void;
  recentColors: string[];
  addRecentColor: (color: string) => void;
  clearRecentColors: () => void;
  playSound: (type?: 'click' | 'success' | 'error') => Promise<void>;
  defaultSettings: ThemeSettings;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const ThemeSettingsContext = createContext<ThemeSettingsContextValue | null>(null);

let _sharedAudioCtx: AudioContext | null = null;

/**
 * Returns the shared AudioContext singleton.
 * @returns {AudioContext}
 */
function getAudioCtx(): AudioContext {
  if (!_sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    _sharedAudioCtx = new AudioContextClass();
  }
  return _sharedAudioCtx!;
}

/**
 * @returns {ThemeSettingsContextValue} Theme settings context value
 * @throws {Error} If used outside a ThemeSettingsProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useThemeSettings() {
  const context = useContext(ThemeSettingsContext);
  if (!context) {
    throw new Error(
      'useThemeSettings must be used within ThemeSettingsProvider'
    );
  }
  return context;
}

const defaultSettings: ThemeSettings = {
  autoApply: false,
  showRGB: true,
  enableAnimations: true,
  showColorNames: false,
  enableKeyboardShortcuts: true,
  showHexValues: true,
  enableSoundEffects: false,
  compactMode: false,
  showRecentColors: true,
  enableColorBlindMode: false
};

/**
 * Provides theme settings state to the component subtree.
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    try {
      const saved = localStorage.getItem('themeSettings');
      const parsed = safeJSONParse(saved, null);
      if (!isPlainObject(parsed)) return defaultSettings;
      const merged = { ...defaultSettings };
      for (const key of Object.keys(defaultSettings) as (keyof ThemeSettings)[]) {
        const val = parsed[key];
        if (typeof val === typeof defaultSettings[key]) {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      return merged;
    } catch (err) {
      logger.error('ThemeSettingsContext: failed to hydrate themeSettings from localStorage', err);
      return defaultSettings;
    }
  });

  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recentColors');
      const parsed = safeJSONParse(saved, null);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      logger.error('ThemeSettingsContext: failed to hydrate recentColors from localStorage', err);
      return [];
    }
  });

  useEffect(() => {
    if (settings.enableAnimations) {
      document.documentElement.style.setProperty('--transition-speed', '0.2s');
      document.documentElement.classList.remove('no-animations');
    } else {
      document.documentElement.style.setProperty('--transition-speed', '0s');
      document.documentElement.classList.add('no-animations');
    }

    document.documentElement.classList.toggle(
      'compact-mode',
      Boolean(settings.compactMode)
    );

    document.documentElement.classList.toggle(
      'color-blind-mode',
      Boolean(settings.enableColorBlindMode)
    );
  }, [
    settings.enableAnimations,
    settings.compactMode,
    settings.enableColorBlindMode
  ]);

  useEffect(() => {
    localStorage.setItem('themeSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('recentColors', JSON.stringify(recentColors));
  }, [recentColors]);

  /**
   * Update a single setting by key.
   *
   * @param {string} key - Setting key
   * @param {*} value - New value
   */
  const updateSetting = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Replace all settings with a new settings object.
   *
   * @param {ThemeSettings} newSettings - Complete settings object
   */
  const updateSettings = useCallback((newSettings: ThemeSettings) => {
    setSettings(newSettings);
  }, []);

  /**
   * Reset all settings to their default values.
   */
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  /**
   * Add a hex color to the top of the recent colors list (max 12 entries).
   *
   * @param {string} color - Hex color to add
   */
  const addRecentColor = useCallback((color: string) => {
    if (!color) return;
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      return [color, ...filtered].slice(0, 12);
    });
  }, []);

  /**
   * Clear all recent colors.
   */
  const clearRecentColors = useCallback(() => {
    setRecentColors([]);
  }, []);

  /**
   * Play a brief synthesised beep if sound effects are enabled.
   *
   * @param {'click'|'success'|'error'} [type='click'] - Sound type
   */
  const playSound = useCallback(
    async (type: 'click' | 'success' | 'error' = 'click') => {
      if (!settings.enableSoundEffects) return;

      try {
        const audioCtx = getAudioCtx();
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const freqMap: Record<string, number> = { click: 800, success: 1200, error: 400 };
        osc.frequency.value = freqMap[type] ?? 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioCtx.currentTime + 0.05
        );

        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      } catch (err) {
        logger.error('ThemeSettingsContext: playSound failed', err);
      }
    },
    [settings.enableSoundEffects]
  );

  useEffect(() => {
    return () => {
      if (_sharedAudioCtx && _sharedAudioCtx.state !== 'closed') {
        _sharedAudioCtx.close();
        _sharedAudioCtx = null;
      }
    };
  }, []);

  const value = useMemo(
    () => ({
      settings,
      updateSetting,
      updateSettings,
      resetSettings,
      recentColors,
      addRecentColor,
      clearRecentColors,
      playSound,
      defaultSettings
    }),
    [
      settings,
      updateSetting,
      updateSettings,
      resetSettings,
      recentColors,
      addRecentColor,
      clearRecentColors,
      playSound
    ]
  );

  return (
    <ThemeSettingsContext.Provider value={value}>
      {children}
    </ThemeSettingsContext.Provider>
  );
}

export default ThemeSettingsContext;
