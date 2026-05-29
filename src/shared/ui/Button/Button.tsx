import { ButtonHTMLAttributes, ElementType,memo, ReactNode } from 'react';

import { ButtonSize,ButtonVariant, getButtonClasses } from '@utils';

/** Props for the `Button` component. Extends all native `<button>` attributes. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Exclude<ButtonVariant, 'base' | 'size'>;
  size?: ButtonSize;
  icon?: ElementType;
  fullWidth?: boolean;
}

/**
 * Styled button primitive with variant, size, and optional leading icon support.
 *
 * Memoized to prevent unnecessary re-renders when used inside large component trees.
 */
const Button = memo(function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      className={getButtonClasses(
        variant,
        size,
        `${fullWidth ? 'w-full' : ''} ${className}`
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
