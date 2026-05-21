import { memo } from 'react';

import { Plus } from 'lucide-react';

/**
 * Button card for adding a new theme preset.
 *
 * @param {Object} props
 * @param {function(): void} props.onClick - Called when the button is pressed
 * @param {boolean} props.disabled - Disables the button when true
 * @returns {JSX.Element}
 */
const AddPresetCard = memo(function AddPresetCard({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Add new theme"
      className={`group relative rounded-lg transition-colors duration-200 overflow-hidden border-2 border-dashed ${disabled ? 'border-border/30 opacity-50 cursor-not-allowed' : 'border-border/60 hover:border-accent/60'}`}
    >
      <div className="flex w-full h-14 bg-surface items-center justify-center gap-1.5">
        <Plus className="w-4 h-4 text-text-muted/50 group-hover:text-accent transition-colors" />
        <span className="text-[11px] font-bold text-text-muted/50 group-hover:text-accent transition-colors">
          Add
        </span>
      </div>
    </button>
  );
});
AddPresetCard.displayName = 'AddPresetCard';
export default AddPresetCard;
