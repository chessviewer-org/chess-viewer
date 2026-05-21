import { memo, ButtonHTMLAttributes, ReactNode, ElementType } from 'react';

import { getButtonClasses, ButtonVariant, ButtonSize } from '@utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Exclude<ButtonVariant, 'base' | 'size'>;
  size?: ButtonSize;
  icon?: ElementType;
  fullWidth?: boolean;
}

/**
 * @param {ButtonProps} props
 * @returns {JSX.Element}
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
