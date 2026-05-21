import React, { memo, useId } from 'react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: React.ReactNode;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * @param {CheckboxProps} props
 * @returns {JSX.Element}
 */
const Checkbox = memo(function Checkbox({
  checked,
  onChange,
  label,
  className = '',
  id: providedId,
  disabled = false
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = providedId || generatedId;
  return (
    <label
      htmlFor={checkboxId}
      className={`flex items-center gap-3 cursor-pointer group p-2 rounded-xl transition-all duration-200 hover:bg-surface-hover/50 focus-within:ring-2 focus-within:ring-accent/50 focus-within:ring-offset-2 focus-within:ring-offset-bg ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer accent-accent rounded outline-none border-none focus:ring-0 focus-visible:outline-none focus:outline-none disabled:cursor-not-allowed"
      />
      <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary transition-colors select-none">
        {label}
      </span>
    </label>
  );
});
Checkbox.displayName = 'Checkbox';
export default Checkbox;
