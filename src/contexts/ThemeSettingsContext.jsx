import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { getStoredValue } from '@/utils/validation';

const ThemeSettingsContext = createContext(null);

let _sharedAudioCtx = null;

/**
 * Returns the shared AudioContext singleton.
 * @returns {AudioContext}
 */
function getAudioCtx() {
  if (!_sharedAudioCtx) {
    _sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _sharedAudioCtx;
}

/**
 * @returns {Object} Theme settings context value
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

const defaultSettings = {
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
export function ThemeSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const parsed = getStoredValue('themeSettings', null);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? { ...defaultSettings, ...parsed }
        : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [recentColors, setRecentColors] = useState(() => {
    try {
      const parsed = getStoredValue('recentColors', null);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
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
  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Replace all settings with a new settings object.
   *
   * @param {Object} newSettings - Complete settings object
   */
  const updateSettings = useCallback((newSettings) => {
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
  const addRecentColor = useCallback((color) => {
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
    async (type = 'click') => {
      if (!settings.enableSoundEffects) return;

      try {
        const audioCtx = getAudioCtx();
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.value =
          { click: 800, success: 1200, error: 400 }[type] ?? 800;
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
      } catch {
        return;
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
