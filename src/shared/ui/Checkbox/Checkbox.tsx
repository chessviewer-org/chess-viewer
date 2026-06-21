import React, { memo, useId } from 'react';

interface CheckboxProps {
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
      className={`flex items-center gap-2.5 cursor-pointer group p-2 rounded-xl transition-opacity duration-200 opacity-80 hover:opacity-100 has-focus-visible:ring-2 has-focus-visible:ring-accent has-focus-visible:opacity-100 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 sm:w-5 sm:h-5 cursor-pointer accent-accent rounded outline-none disabled:cursor-not-allowed"
      />
      <span className="text-sm font-semibold text-text-secondary group-hover:text-text-primary transition-colors select-none">
        {label}
      </span>
    </label>
  );
});
Checkbox.displayName = 'Checkbox';
export default Checkbox;
