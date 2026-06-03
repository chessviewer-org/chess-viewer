import { memo } from 'react';

import { Moon, Sun } from 'lucide-react';

/** Props for the standalone navbar theme toggle. */
interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: (event?: React.SyntheticEvent | Event) => void;
}

/** One-click dark/light switch, placed left of the account menu. Default dark → light on click. */
export const ThemeToggle = memo(function ThemeToggle({
  theme,
  toggleTheme
}: ThemeToggleProps) {
  return (
    <button
      onClick={(e) => toggleTheme(e)}
      className="p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover active:bg-surface-elevated transition-colors duration-200"
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
});
