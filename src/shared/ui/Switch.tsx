import React, { memo, useId } from 'react';
import styles from '../styles/ui.module.scss';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  'aria-label'?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

const Switch = memo(function Switch({
  checked,
  onChange,
  label,
  description,
  'aria-label': ariaLabel,
  className = '',
  id: providedId,
  disabled = false
}: SwitchProps) {
  const generatedId = useId();
  const switchId = providedId ?? generatedId;
  const labelId = label ? `${switchId}-label` : undefined;
  const descId = description ? `${switchId}-desc` : undefined;

  return (
    <div
      className={`${styles['switchContainer']} ${disabled ? styles['switchContainerDisabled'] : ''} ${className}`}
    >
      {(label ?? description) && (
        <div className="min-w-0">
          {label && (
            <p id={labelId} className={styles['switchLabel']}>
              {label}
            </p>
          )}
          {description && (
            <p id={descId} className={styles['switchDesc']}>
              {description}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        aria-label={ariaLabel}
        aria-labelledby={labelId}
        aria-describedby={descId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`${styles['switchButton']} ${
          checked
            ? styles['switchButtonChecked']
            : styles['switchButtonUnchecked']
        }`}
      >
        <span
          aria-hidden="true"
          className={`${styles['switchThumb']} ${
            checked
              ? styles['switchThumbChecked']
              : styles['switchThumbUnchecked']
          }`}
        />
      </button>
    </div>
  );
});

Switch.displayName = 'Switch';
export { Switch };
