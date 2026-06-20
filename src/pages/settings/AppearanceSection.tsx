import { memo } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Contrast, Monitor, Moon, Sparkles, Sun } from 'lucide-react';

import { useContrastSetting, useThemeMode } from '@hooks';
import { useEffectiveReducedMotion } from '@hooks';

import type { ContrastPreference, ThemeModePreference } from '@utils';
import { CustomSelect } from '@shared/ui';
import { SettingsBlock } from './parts';

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
  const [themeMode, setThemeMode] = useThemeMode();
  const [contrast, setContrast] = useContrastSetting();
  const reduceMotion = useEffectiveReducedMotion();

  // The dark-mode recommendation note expands/collapses to follow the choice:
  // shown unless the user has explicitly picked light.
  const showDarkHint = themeMode !== 'light';

  return (
    <div className="space-y-8 animate-pageEnter">
      <SettingsBlock
        title="Theme"
        description="Personalise how ChessVision looks, saved on this device and synced when you sign in."
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
        <AnimatePresence initial={false}>
          {showDarkHint && (
            <motion.div
              initial={
                reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, height: 'auto', y: 0 }
              }
              exit={
                reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
              }
              className="overflow-hidden"
            >
              <p className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-text-secondary">
                <Sparkles
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                  aria-hidden="true"
                />
                <span>
                  ChessVision is better optimised for{' '}
                  <span className="font-semibold text-accent">dark mode</span> —
                  recommended.
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
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
