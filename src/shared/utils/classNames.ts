export const classNames = {
  button: {
    base: 'rounded-xl font-semibold transition-all duration-200 ease-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/50',
    primary:
      'bg-accent hover:bg-accent-hover text-bg shadow-sm hover:shadow-md',
    outline:
      'bg-transparent hover:bg-surface-hover text-text-primary border border-border hover:border-accent/50',
    ghost:
      'bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary',
    gradient:
      'bg-gradient-to-r from-accent to-secondary text-bg shadow-sm hover:shadow-md',
    size: {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm'
    }
  },
  input: {
    base: 'w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-text-primary placeholder-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
    error: 'border-error focus:ring-error/50 focus:border-error'
  },
  text: {
    label: 'text-sm font-semibold text-text-secondary'
  }
} as const;

export type ButtonVariant = keyof typeof classNames.button;
export type ButtonSize = keyof typeof classNames.button.size;
export type InputState = 'normal' | 'error';

/**
 * Joins truthy class name strings into a single space-separated string.
 *
 * @param classes - Class name strings, booleans, or null/undefined values
 * @returns Combined class names
 */
export function cn(
  ...classes: Array<string | boolean | undefined | null>
): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Returns combined Tailwind classes for a button element.
 *
 * @param variant - The button style variant
 * @param size - The button size
 * @param className - Additional class names
 * @returns Combined class string
 */
export function getButtonClasses(
  variant: Exclude<ButtonVariant, 'base' | 'size'> = 'primary',
  size: ButtonSize = 'md',
  className = ''
): string {
  return cn(
    classNames.button.base,
    classNames.button[variant] as string,
    classNames.button.size[size],
    className
  );
}

/**
 * Returns combined Tailwind classes for an input element.
 *
 * @param state - The validation state of the input
 * @param className - Additional class names
 * @returns Combined class string
 */
export function getInputClasses(
  state: InputState = 'normal',
  className = ''
): string {
  let stateClass = '';
  if (state === 'error') {
    stateClass = classNames.input.error;
  }
  return cn(classNames.input.base, stateClass, className);
}
