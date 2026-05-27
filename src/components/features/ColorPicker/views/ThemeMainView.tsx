import { memo, useCallback, useMemo, useState } from 'react';
import { Palette, Wand2 } from 'lucide-react';
import { BOARD_THEMES } from '@constants';
import { ThemeConfig } from '@app-types';
import ThemePresetButton from './parts/ThemePresetButton';
import CustomThemeCard from './parts/CustomThemeCard';
import ThemeBoardPreview from './parts/ThemeBoardPreview';
import ThemeCustomPicker from './parts/ThemeCustomPicker';

/** Props for `ThemeMainView`. */
export interface ThemeMainViewProps {
  currentLight: string;
  currentDark: string;
  onThemeApply: (light: string, dark: string) => void;
}

const ThemeMainView = memo(function ThemeMainView({
  currentLight,
  currentDark,
  onThemeApply
}: ThemeMainViewProps) {
  const [mode, setMode] = useState<'main' | 'custom'>('main');

  const isCustomTheme = !Object.values(BOARD_THEMES)
    .slice(0, 19)
    .some((theme) => theme.light === currentLight && theme.dark === currentDark);

  const sortedThemes = useMemo(
    () =>
      Object.entries(BOARD_THEMES)
        .slice(0, 19)
        .sort((a, b) => {
          const getLightness = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return (r + g + b) / 3;
          };
          return getLightness(b[1].light) - getLightness(a[1].light);
        }),
    []
  );

  const handleThemeClick = useCallback(
    (_key: string, theme: ThemeConfig) => {
      onThemeApply(theme.light, theme.dark);
      setMode('main');
    },
    [onThemeApply]
  );

  const handleCustomCardClick = useCallback(() => setMode('custom'), []);

  return (
    <div className="h-full flex flex-col bg-surface-elevated rounded-2xl border border-border overflow-hidden">
      <div className="flex-1 grid lg:grid-cols-[1fr,1fr] gap-6 p-6 overflow-hidden">
        <ThemeBoardPreview currentLight={currentLight} currentDark={currentDark} />

        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto px-2">
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setMode('main')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${mode === 'main' ? 'bg-accent text-bg shadow-md' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover border border-border'}`}
            >
              <Palette className="w-4 h-4" />
              Main
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 ${mode === 'custom' ? 'bg-accent text-bg shadow-md' : 'bg-surface-elevated text-text-secondary hover:bg-surface-hover border border-border'}`}
            >
              <Wand2 className="w-4 h-4" />
              Custom
            </button>
          </div>

          {mode === 'main' ? (
            <>
              <div className="flex items-center gap-2 shrink-0 mt-6">
                <Palette className="w-4 h-4 text-accent" />
                <h2 className="font-semibold text-text-primary">Theme Presets</h2>
              </div>
              <div
                className="grid grid-cols-3 sm:grid-cols-4 gap-2"
                role="group"
                aria-label="Theme preset options"
              >
                {sortedThemes.map(([key, theme]) => {
                  const isActive =
                    theme.light === currentLight && theme.dark === currentDark;
                  return (
                    <ThemePresetButton
                      key={key}
                      themeKey={key}
                      theme={theme}
                      isActive={isActive}
                      onClick={handleThemeClick}
                    />
                  );
                })}
                <CustomThemeCard
                  isActive={isCustomTheme}
                  onClick={handleCustomCardClick}
                />
              </div>
            </>
          ) : (
            <ThemeCustomPicker
              currentLight={currentLight}
              currentDark={currentDark}
              onThemeApply={onThemeApply}
            />
          )}
        </div>
      </div>
    </div>
  );
});

ThemeMainView.displayName = 'ThemeMainView';
export default ThemeMainView;
