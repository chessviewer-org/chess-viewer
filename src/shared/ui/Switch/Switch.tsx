import React, { memo, useId } from 'react';

import { motion, useReducedMotion } from 'framer-motion';

export interface SwitchProps {
  /** Whether the switch is on. */
  checked: boolean;
  /** Fired with the next checked state when the user toggles. */
  onChange: (checked: boolean) => void;
  /** Visible label rendered beside the track. */
  label?: React.ReactNode;
  /** Secondary description rendered under the label. */
  description?: React.ReactNode;
  /** Accessible label for the control when no visible `label` is supplied. */
  'aria-label'?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Accessible range-slider-style toggle. The track is grey when off and amber
 * (`accent`) when on; the thumb slides between the two ends. Implemented as a
 * native `role="switch"` button so keyboard + screen-reader semantics are free,
 * with a framer-motion thumb that respects `prefers-reduced-motion`.
 */
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
  const switchId = providedId || generatedId;
  const labelId = label ? `${switchId}-label` : undefined;
  const descId = description ? `${switchId}-desc` : undefined;
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <p id={labelId} className="text-sm font-semibold text-text-primary">
              {label}
            </p>
          )}
          {description && (
            <p id={descId} className="text-xs text-text-secondary mt-0.5">
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
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed ${
          checked
            ? 'bg-accent border-accent'
            : 'bg-surface-hover border-border hover:bg-border-subtle'
        }`}
      >
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ x: checked ? 22 : 2 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 500, damping: 32 }
          }
          className={`block h-4 w-4 rounded-full shadow-sm ${
            checked ? 'bg-bg' : 'bg-text-secondary'
          }`}
        />
      </button>
    </div>
  );
});

Switch.displayName = 'Switch';
export default Switch;
