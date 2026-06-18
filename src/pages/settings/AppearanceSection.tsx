import { memo } from 'react';

import { Check, Contrast, Monitor, Moon, Palette, Sun } from 'lucide-react';

import { useAccentSetting, useContrastSetting, useThemeMode } from '@hooks';
import { ACCENT_THEMES } from '@constants';

import type { ContrastPreference, ThemeModePreference } from '@utils';
import { CustomSelect } from '@shared/ui';
import { SettingsBlock, SettingsHeading } from './parts';

const THEME_MODE_OPTIONS: Array<{
  value: ThemeModePreference;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  {
    value: 'system',
    label: 'System',
    icon: <Monitor className="h-4 w-4" />
  }
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
  const [accentId, select] = useAccentSetting();
  const [themeMode, setThemeMode] = useThemeMode();
  const [contrast, setContrast] = useContrastSetting();

  return (
    <div className="space-y-8 animate-pageEnter">
      <SettingsHeading
        icon={Palette}
        title="Appearance"
        description="Personalise how ChessVision looks. Your choices are saved on this device, and sync (end-to-end encrypted) across your devices when you are signed in."
      />

      <SettingsBlock
        title="Theme"
        description="Choose Light or Dark, or let ChessVision follow your system setting."
      >
        <div className="max-w-xs">
          <CustomSelect
            value={themeMode}
            onChange={setThemeMode}
            options={THEME_MODE_OPTIONS}
            label="Theme mode"
          />
        </div>
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

      <SettingsBlock
        title="Accent colour"
        description="The accent colour is used for highlights, the active state, links, and buttons throughout the app. It applies instantly."
      >
        <div
          role="radiogroup"
          aria-label="Accent colour"
          className="grid grid-cols-3 gap-4 sm:grid-cols-6"
        >
          {ACCENT_THEMES.map((theme) => {
            const isSelected = theme.id === accentId;
            const swatchColor = `rgb(${theme.dark.accent})`;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={theme.label}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => select(theme.id)}
                className="flex flex-col items-center gap-2 rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-[border-color,box-shadow] duration-200 ${
                    isSelected
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-border/60 hover:border-text-muted'
                  }`}
                  style={{ backgroundColor: swatchColor }}
                >
                  {isSelected && (
                    <Check
                      className="h-5 w-5 text-bg"
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-accent' : 'text-text-secondary'
                  }`}
                >
                  {theme.label}
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
