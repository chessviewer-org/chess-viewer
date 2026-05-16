import { memo, useCallback } from 'react';

import { Pipette } from 'lucide-react';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
const ColorInput = memo(
  function ColorInput({
    value,
    hexInput,
    onHexChange,
    onToggle,
    getRgbValues
  }) {
    const handleInputChange = useCallback(
      (e) => {
        onHexChange(e);
      },
      [onHexChange]
    );
    const handleInputBlur = useCallback(
      (e) => {
        if (!/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          e.target.value = value;
        }
      },
      [value]
    );
    return (
      <div className="flex items-center gap-2 p-2.5 bg-bg rounded-xl border border-border/50 transition-all shadow-lg">
        <button
          onClick={onToggle}
          className="w-14 h-14 rounded-lg flex-shrink-0 transition-all shadow-lg hover:shadow-xl relative overflow-hidden group outline-none"
          style={{
            background: value
          }}
          aria-label="Open color picker"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <div className="flex-1 space-y-1">
          <input
            type="text"
            value={hexInput}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-full bg-bg text-text-primary text-sm font-mono font-bold px-3 py-2 rounded-lg outline-none transition-all caret-accent"
            placeholder="#FFFFFF"
            maxLength={7}
          />
          <div className="text-xs text-text-muted font-mono px-1">
            RGB: {getRgbValues()}
          </div>
        </div>

        <button
          onClick={onToggle}
          className="p-3 bg-gradient-to-br from-accent/20 to-secondary/20 hover:from-accent/30 hover:to-secondary/30 rounded-lg transition-all shadow-lg outline-none"
          aria-label="Pick color from palette"
        >
          <Pipette className="w-5 h-5 text-accent" />
        </button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.hexInput === nextProps.hexInput
    );
  }
);
ColorInput.displayName = 'ColorInput';
export default ColorInput;
