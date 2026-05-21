import { memo, useId, InputHTMLAttributes, ElementType } from 'react';

import { AlertCircle } from 'lucide-react';

import { classNames, cn, getInputClasses } from '@utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ElementType;
  containerClassName?: string;
}

/**
 * @param {InputProps} props
 * @returns {JSX.Element}
 */
const Input = memo(function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  icon: Icon,
  className = '',
  id: providedId,
  containerClassName = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const errorId = `${inputId}-error`;
  const state = error ? 'error' : 'normal';
  
  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className={classNames.text.label}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={getInputClasses(
            state,
            cn(
              Icon && 'pl-10',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && (
        <div
          id={errorId}
          className="flex items-center gap-2 text-error text-xs"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
