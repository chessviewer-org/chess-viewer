import React, { memo, useId } from 'react';
import styles from '../styles/ui.module.scss';

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: React.ReactNode;
  className?: string;
  id?: string;
  disabled?: boolean;
}

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
      className={`group ${styles['checkboxLabel']} ${disabled ? styles['checkboxLabelDisabled'] : ''} ${className}`}
    >
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles['checkboxInput']}
      />
      <span className={styles['checkboxText']}>{label}</span>
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
