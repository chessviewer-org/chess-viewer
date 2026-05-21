import { memo } from 'react';
import { Check } from 'lucide-react';

export interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: (color: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * @param {ColorSwatchProps} props
 * @returns {JSX.Element}
 */
const ColorSwatch = memo(
  function ColorSwatch({ color, isSelected, onClick, size = 'md' }: ColorSwatchProps) {
    const sizes = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12'
    };

    return (
      <button
        onClick={() => onClick(color)}
        className={`
        ${sizes[size]}
        rounded-lg border-2 transition-all
        hover:shadow-md  relative
        ${isSelected ? 'border-accent scale-105 shadow-lg' : 'border-border hover:border-accent/40'}
      `}
        style={{
          background: color
        }}
        aria-label={`Select color ${color}`}
      >
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-md">
              <Check className="w-3 h-3 text-bg" strokeWidth={3} />
            </div>
          </div>
        )}
      </button>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.color === nextProps.color &&
      prevProps.isSelected === nextProps.isSelected
    );
  }
);

ColorSwatch.displayName = 'ColorSwatch';
export default ColorSwatch;
