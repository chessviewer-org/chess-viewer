import { memo } from 'react';
import { Wand2 } from 'lucide-react';

/** Props for the `CustomThemeCard` entry in the preset grid. */
interface CustomThemeCardProps {
  isActive: boolean;
  onClick: () => void;
}

const CustomThemeCard = memo(function CustomThemeCard({
  isActive,
  onClick
}: CustomThemeCardProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Create custom theme"
      className={`group relative p-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 hover:shadow-md hover:bg-surface-hover overflow-hidden ${isActive ? 'bg-accent/20 shadow-lg shadow-accent/20' : 'hover:bg-surface-elevated'}`}
    >
      <div className="relative">
        <div
          className="flex w-full h-12 rounded-lg overflow-hidden shadow-sm bg-linear-to-r from-purple-500 via-pink-500 to-orange-500"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out">
          <Wand2 className="w-4 h-4 text-white mr-1.5" />
          <span className="text-white text-xs font-semibold">Custom</span>
        </div>
      </div>
    </button>
  );
});

CustomThemeCard.displayName = 'CustomThemeCard';
export default CustomThemeCard;
