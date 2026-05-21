import { memo } from 'react';
import { Check } from 'lucide-react';
import { ThemeConfig } from '@app-types';

export interface ThemePresetCardProps {
  theme: ThemeConfig;
  themeKey: string;
  isActive: boolean;
  isHovered: boolean;
  onHover: (theme: ThemeConfig) => void;
  onLeave: () => void;
  onClick: (themeKey: string, theme: ThemeConfig) => void;
}

/**
 * @param {ThemePresetCardProps} props
 * @returns {JSX.Element}
 */
const ThemePresetCard = memo(
  function ThemePresetCard({
    theme,
    themeKey,
    isActive,
    isHovered,
    onHover,
    onLeave,
    onClick
  }: ThemePresetCardProps) {
    return (
      <button
        onClick={() => onClick(themeKey, theme)}
        onMouseEnter={() => onHover(theme)}
        onMouseLeave={onLeave}
        className={`
        group relative px-3 py-4 rounded-xl text-xs text-text-secondary
        transition-all duration-300 overflow-hidden
        ${isActive ? 'bg-accent/30 border-2 border-accent scale-105' : 'bg-bg border-2 border-border hover:border-accent/50'}
        ${isHovered ? 'scale-105' : ''}
      `}
      >
        <div className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-opacity flex">
          <div
            className="w-1/2 h-full"
            style={{
              background: theme.light
            }}
          />
          <div
            className="w-1/2 h-full"
            style={{
              background: theme.dark
            }}
          />
        </div>

        <span className="relative z-10 font-semibold drop-shadow-md text-white">
          {theme.name}
        </span>

        {isActive && (
          <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-bg" strokeWidth={3} />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </button>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isActive === nextProps.isActive &&
      prevProps.isHovered === nextProps.isHovered &&
      prevProps.themeKey === nextProps.themeKey
    );
  }
);

ThemePresetCard.displayName = 'ThemePresetCard';
export default ThemePresetCard;
