import { memo } from 'react';
import { ChevronDown, ChevronUp, Moon, Sun } from 'lucide-react';

type SubmenuKey = 'settings' | 'theme' | null;

/** Props for the `ThemeSubmenu` nested dropdown item. */
interface ThemeSubmenuProps {
  theme: 'light' | 'dark';
  toggleTheme: (event?: React.SyntheticEvent | Event) => void;
  openSubmenu: SubmenuKey;
  setOpenSubmenu: React.Dispatch<React.SetStateAction<SubmenuKey>>;
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ThemeSubmenu = memo(function ThemeSubmenu({
  theme,
  toggleTheme,
  openSubmenu,
  setOpenSubmenu,
  setIsDropdownOpen
}: ThemeSubmenuProps) {
  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpenSubmenu(openSubmenu === 'theme' ? null : 'theme')}
        className="w-full rounded-lg px-2 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {theme === 'dark' ? (
            <Moon className="w-4 h-4 text-text-secondary" />
          ) : (
            <Sun className="w-4 h-4 text-text-secondary" />
          )}
          <span>Theme</span>
        </div>
        {openSubmenu === 'theme' ? (
          <ChevronUp className="w-4 h-4 text-text-secondary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-secondary" />
        )}
      </button>

      {openSubmenu === 'theme' && (
        <div className="pl-8 pr-2 py-1 flex flex-col gap-1 border-l-2 border-surface-hover ml-3 mt-1 mb-1">
          <button
            onClick={(e) => {
              if (theme !== 'light') toggleTheme(e);
              setIsDropdownOpen(false);
            }}
            className={`text-left text-xs py-1.5 transition-colors ${
              theme === 'light'
                ? 'text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Light
          </button>
          <button
            onClick={(e) => {
              if (theme !== 'dark') toggleTheme(e);
              setIsDropdownOpen(false);
            }}
            className={`text-left text-xs py-1.5 transition-colors ${
              theme === 'dark'
                ? 'text-accent font-semibold'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Dark
          </button>
        </div>
      )}
    </div>
  );
});
