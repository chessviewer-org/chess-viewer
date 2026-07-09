import { memo } from 'react';

import { Check, Contrast, Monitor, Moon, Sparkles, Sun } from '@/assets/icons';

import { useContrastSetting, useThemeMode } from '@hooks';

import type { ContrastPreference, ThemeModePreference } from '@utils';
import { CustomSelect } from '@ui';
import { SettingsBlock } from './parts';

const THEME_MODE_OPTIONS: Array<{
  value: ThemeModePreference;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> }
];

const CONTRAST_OPTIONS: ReadonlyArray<{
  id: ContrastPreference;
  label: string;
  description: string;
}> = [
  {
    id: 'normal',
    label: 'Default',
    description: 'The standard balance of colour and legibility.'
  },
  {
    id: 'high',
    label: 'High contrast',
    description: 'Stronger borders and text for improved readability.'
  }
];

const AppearanceSection = memo(function AppearanceSection() {
  const [themeMode, setThemeMode] = useThemeMode();
  const [contrast, setContrast] = useContrastSetting();

  const showDarkHint = themeMode !== 'light';

  return (
    <div className="space-y-8 stagger-children">
      <SettingsBlock
        title="Theme"
        description="Personalise how ChessViewer looks, saved on this device and synced when you sign in."
      >
        <div className="max-w-xs space-y-2.5">
          <span className="block text-base font-bold text-text-primary">
            Theme mode
          </span>
          <CustomSelect
            value={themeMode}
            onChange={setThemeMode}
            options={THEME_MODE_OPTIONS}
          />
        </div>
        {showDarkHint && (
          <p className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-text-secondary animate-[fadeIn_0.22s_ease_both]">
            <Sparkles
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
              aria-hidden="true"
            />
            <span>
              ChessViewer is better optimised for{' '}
              <span className="font-semibold text-accent">dark mode</span> —
              recommended.
            </span>
          </p>
        )}
      </SettingsBlock>

      <SettingsBlock
        title="Contrast"
        description="Increase the contrast of borders and text against backgrounds for better readability. Applies on top of your Light or Dark theme."
      >
        <div
          role="radiogroup"
          aria-label="Contrast"
          className="grid gap-3 sm:grid-cols-2"
        >
          {CONTRAST_OPTIONS.map(({ id, label, description }) => {
            const isSelected = id === contrast;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setContrast(id)}
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-surface-elevated hover:border-text-muted'
                }`}
              >
                <Contrast
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    isSelected ? 'text-accent' : 'text-text-muted'
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
                    {label}
                    {isSelected && (
                      <Check
                        className="h-4 w-4 text-accent"
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">
                    {description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </SettingsBlock>
    </div>
  );
});

AppearanceSection.displayName = 'AppearanceSection';
export default AppearanceSection;
