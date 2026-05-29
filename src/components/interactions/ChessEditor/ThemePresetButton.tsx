import { memo } from 'react';

import { useIntersectionObserver } from '@hooks';
import { ThemeConfig } from '@app-types';

/** Props for the `ThemePresetButton` lazy-loaded theme tile. */
interface ThemePresetButtonProps {
  themeKey: string;
  theme: ThemeConfig;
  isActive: boolean;
  onClick: (themeKey: string, theme: ThemeConfig) => void;
}

const ThemePresetButton = memo(function ThemePresetButton({
  themeKey,
  theme,
  isActive,
  onClick
}: ThemePresetButtonProps) {
  const { ref, isVisible } = useIntersectionObserver<HTMLButtonElement>({
    threshold: 0.1,
    rootMargin: '100px'
  });

  return (
    <button
      ref={ref}
      onClick={() => onClick(themeKey, theme)}
      aria-label={`Apply ${theme.name || themeKey} theme: light ${theme.light}, dark ${theme.dark}`}
      className={`group relative p-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 hover:shadow-md hover:bg-surface-hover overflow-hidden ${isActive ? 'bg-accent/20 shadow-lg shadow-accent/20' : 'hover:bg-surface-elevated'}`}
    >
      {isVisible ? (
        <div className="relative">
          <div
            className="flex w-full h-12 rounded-lg overflow-hidden shadow-sm"
            aria-hidden="true"
          >
            <div
              className="flex-1"
              style={{ backgroundColor: theme.light }}
              title={`Light: ${theme.light}`}
            />
            <div
              className="flex-1"
              style={{ backgroundColor: theme.dark }}
              title={`Dark: ${theme.dark}`}
            />
          </div>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out">
            <span className="text-white text-xs font-semibold px-2 text-center">
              {theme.name || themeKey}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full h-12 rounded-lg skeleton" />
      )}
    </button>
  );
});

ThemePresetButton.displayName = 'ThemePresetButton';
export default ThemePresetButton;
