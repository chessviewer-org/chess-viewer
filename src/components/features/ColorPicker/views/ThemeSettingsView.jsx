import { useCallback, useEffect, useState } from 'react';

import { Eye, Grid3X3, RotateCcw, Zap } from 'lucide-react';

import { logger } from '@/utils/logger';
import { safeJSONParse } from '@/utils/validation';

const STORAGE_KEY = 'chess-vision-settings';

/**
 * Settings panel inside the color picker for performance and accessibility tweaks.
 * @param {Object} props
 * @param {Function} [props.onSettingsChange] - Called when any setting value changes
 * @returns {JSX.Element}
 */
function ThemeSettingsView({ onSettingsChange }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = safeJSONParse(saved, null);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : {
            reduceAnimations: false,
            lowQualityPreview: false,
            compactBoard: false
          };
    } catch {
      return {
        reduceAnimations: false,
        lowQualityPreview: false,
        compactBoard: false
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      if (onSettingsChange) onSettingsChange(settings);

      if (settings.reduceAnimations) {
        document.documentElement.style.setProperty(
          '--animation-duration',
          '0ms'
        );
      } else {
        document.documentElement.style.setProperty(
          '--animation-duration',
          '200ms'
        );
      }
    } catch {
      logger.warn('Settings save failed');
    }
  }, [settings, onSettingsChange]);

  /**
   * Toggles a boolean setting by its key.
   * @param {string} key - Setting key to toggle
   */
  const handleToggle = useCallback((key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /**
   * Resets all settings to their default values.
   */
  const handleReset = useCallback(() => {
    const defaults = {
      reduceAnimations: false,
      lowQualityPreview: false,
      compactBoard: false
    };
    setSettings(defaults);
  }, []);

  const items = [
    {
      key: 'reduceAnimations',
      label: 'Reduce Animations',
      desc: 'Faster UI',
      icon: Zap
    },
    {
      key: 'lowQualityPreview',
      label: 'Fast Preview',
      desc: 'Lower quality, faster',
      icon: Eye
    },
    {
      key: 'compactBoard',
      label: 'Compact Board',
      desc: 'Smaller preview',
      icon: Grid3X3
    }
  ];

  return (
    <div className="p-2 space-y-2">
      {items.map(({ key, label, desc, icon: Icon }) => (
        <button
          key={key}
          onClick={() => handleToggle(key)}
          className="w-full p-2 bg-bg hover:bg-surface-elevated rounded border border-border/40 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-4 h-4 text-text-muted shrink-0" />
            <div className="text-left min-w-0">
              <div className="text-xs font-medium text-text-primary">
                {label}
              </div>
              <div className="text-[10px] text-text-muted">{desc}</div>
            </div>
          </div>
          <div
            className={`w-8 h-4 rounded-full transition-colors ${settings[key] ? 'bg-accent' : 'bg-surface-hover'}`}
          >
            <div
              className={`w-3 h-3 mt-0.5 rounded-full bg-bg shadow transition-transform ${settings[key] ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
            />
          </div>
        </button>
      ))}
      <button
        onClick={handleReset}
        className="w-full p-1.5 bg-surface-elevated/50 hover:bg-surface-hover/50 text-text-muted text-[10px] font-medium rounded flex items-center justify-center gap-1"
      >
        <RotateCcw className="w-3 h-3" />
        Reset
      </button>
    </div>
  );
}

export default ThemeSettingsView;
