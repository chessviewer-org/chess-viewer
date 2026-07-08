import { Check } from 'lucide-react';

/**
 * A circular swatch showing a light/dark color pair with an optional checkmark
 * overlay when selected.
 */
export function Swatch({
  light,
  dark,
  name,
  isSelected,
  onClick
}: {
  light: string;
  dark: string;
  name: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      title={name}
      aria-label={`Apply ${name} theme`}
      className={`relative flex h-11 w-11 overflow-hidden rounded-full border-2 transition-[border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isSelected
          ? 'border-accent ring-2 ring-accent/30'
          : 'border-border/60 hover:border-text-muted'
      }`}
    >
      <span className="h-full w-1/2" style={{ backgroundColor: light }} />
      <span className="h-full w-1/2" style={{ backgroundColor: dark }} />
      {isSelected && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <Check className="h-4 w-4 text-white drop-shadow" aria-hidden />
        </span>
      )}
    </button>
  );
}
