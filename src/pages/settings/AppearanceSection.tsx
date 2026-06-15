import { memo, useCallback, useRef } from 'react';

import {
  Check,
  type LucideIcon,
  Monitor,
  Moon,
  Palette,
  Sun
} from 'lucide-react';

import { useAccentSetting, useThemeMode } from '@hooks';
import { ACCENT_THEMES } from '@constants';

import type { ThemeModePreference } from '@utils';
import { SettingsBlock, SettingsHeading } from './parts';

/** The Light / Dark / System options for the theme-mode control. */
const THEME_MODE_OPTIONS: ReadonlyArray<{
  id: ThemeModePreference;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor }
];

/**
 * Appearance section. Two concerns:
 *   1. A Light / Dark / System theme-mode control backed by `useThemeMode()`.
 *      Light/Dark pin the site (persisted + E2EE-synced); System clears the
 *      override so the app follows the OS. App applies the change live via the
 *      theme-mode change event.
 *   2. An accent-colour chooser backed by `useAccentSetting()` — selecting a
 *      swatch applies the accent live (the App-level `useAccentTheme` listens
 *      for the change event) and persists it locally + via E2EE sync.
 *
 * Emoji, tab size, and markdown settings are intentionally excluded
 * (out of scope / not applicable here).
 */
const AppearanceSection = memo(function AppearanceSection() {
  const [accentId, select] = useAccentSetting();
  const [themeMode, setThemeMode] = useThemeMode();
  const swatchRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const modeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusSwatch = useCallback((id: string) => {
    swatchRefs.current.get(id)?.focus();
  }, []);

  const handleModeKeyDown = useCallback(
    (event: React.KeyboardEvent, currentId: ThemeModePreference) => {
      const index = THEME_MODE_OPTIONS.findIndex((o) => o.id === currentId);
      if (index < 0) return;
      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = (index + 1) % THEME_MODE_OPTIONS.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex =
            (index - 1 + THEME_MODE_OPTIONS.length) % THEME_MODE_OPTIONS.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = THEME_MODE_OPTIONS.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      const next = THEME_MODE_OPTIONS[nextIndex];
      if (next) {
        setThemeMode(next.id);
        modeRefs.current.get(next.id)?.focus();
      }
    },
    [setThemeMode]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, currentId: string) => {
      const index = ACCENT_THEMES.findIndex((t) => t.id === currentId);
      if (index < 0) return;
      let nextIndex: number | null = null;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = (index + 1) % ACCENT_THEMES.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = (index - 1 + ACCENT_THEMES.length) % ACCENT_THEMES.length;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = ACCENT_THEMES.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      const next = ACCENT_THEMES[nextIndex];
      if (next) {
        select(next.id);
        focusSwatch(next.id);
      }
    },
    [select, focusSwatch]
  );

  return (
    <div className="space-y-8 animate-pageEnter">
      <SettingsHeading
        icon={Palette}
        title="Appearance"
        description="Personalise how ChessVision looks. Your choices are saved on this device, and sync (end-to-end encrypted) across your devices when you are signed in."
      />

      <SettingsBlock
        title="Theme"
        description="Choose Light or Dark, or let ChessVision follow your system (operating-system) setting. Light and Dark are saved on this device and synced when you are signed in."
      >
        <div
          role="radiogroup"
          aria-label="Theme mode"
          className="inline-flex gap-1.5 rounded-xl border border-border bg-surface-elevated p-1.5"
        >
          {THEME_MODE_OPTIONS.map(({ id, label, icon: Icon }) => {
            const isSelected = id === themeMode;
            return (
              <button
                key={id}
                ref={(el) => {
                  if (el) modeRefs.current.set(id, el);
                  else modeRefs.current.delete(id);
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={label}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setThemeMode(id)}
                onKeyDown={(e) => handleModeKeyDown(e, id)}
                className={`flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? 'bg-accent text-bg'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
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
            // Preview swatch colour comes from the preset DATA (the dark-mode
            // triple), rendered via inline backgroundColor — the sanctioned
            // mechanism for sample swatches, not a hardcoded JSX theme colour.
            const swatchColor = `rgb(${theme.dark.accent})`;
            return (
              <button
                key={theme.id}
                ref={(el) => {
                  if (el) swatchRefs.current.set(theme.id, el);
                  else swatchRefs.current.delete(theme.id);
                }}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={theme.label}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => select(theme.id)}
                onKeyDown={(e) => handleKeyDown(e, theme.id)}
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
