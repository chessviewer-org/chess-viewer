export const classNames = {
  button: {
    base: 'rounded-xl font-semibold transition-all duration-200 ease-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/50',
    primary:
      'bg-accent hover:bg-accent-hover text-bg shadow-sm hover:shadow-md',
    secondary: 'bg-secondary hover:bg-secondary-hover text-bg',
    success: 'bg-success hover:bg-success/90 text-bg',
    danger: 'bg-error hover:bg-error/90 text-bg',
    outline:
      'bg-transparent hover:bg-surface-hover text-text-primary border border-border hover:border-accent/50',
    ghost:
      'bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary',
    gradient:
      'bg-gradient-to-r from-accent to-secondary text-bg shadow-sm hover:shadow-md',
    size: {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base'
    }
  },
  card: {
    base: 'rounded-2xl shadow-md',
    gradient: 'bg-gradient-to-br from-surface-elevated to-surface',
    glass: 'glass',
    border: 'border border-border/50 bg-surface-elevated',
    padding: {
      sm: 'p-3 sm:p-4',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8'
    }
  },
  input: {
    base: 'w-full px-4 py-2.5 bg-surface-hover border border-border rounded-xl text-text-primary placeholder-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
    error: 'border-error focus:ring-error/50 focus:border-error',
    success: 'border-success focus:ring-success/50 focus:border-success'
  },
  modal: {
    overlay: 'fixed inset-0 z-50 flex items-center justify-center p-4',
    container:
      'bg-surface border border-border rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto relative z-10',
    header:
      'sticky top-0 bg-surface border-b border-border p-4 flex items-center justify-between z-10',
    content: 'p-6'
  },
  text: {
    heading: {
      h1: 'text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-text-primary',
      h2: 'text-2xl sm:text-3xl font-display font-bold text-text-primary',
      h3: 'text-xl sm:text-2xl font-display font-bold text-text-primary',
      h4: 'text-lg sm:text-xl font-display font-semibold text-text-primary'
    },
    body: {
      base: 'text-text-secondary',
      sm: 'text-sm text-text-muted',
      xs: 'text-xs text-text-muted'
    },
    label: 'text-sm font-semibold text-text-secondary'
  },
  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    page: 'h-screen max-h-screen overflow-hidden bg-bg',
    section: 'py-12 sm:py-16 lg:py-24'
  },
  animation: {
    fadeIn: 'animate-fade-in',
    fadeInUp: 'animate-fade-in-up',
    fadeInDown: 'animate-fade-in-down',
    slideInLeft: 'animate-slide-in-left',
    slideInRight: 'animate-slide-in-right',
    scaleIn: 'animate-scale-in'
  }
};
/**
 * Joins truthy class name strings into a single space-separated string.
 *
 * @param {...string} classes - Class name strings (falsy values are ignored)
 * @returns {string} Combined class names
 */
export function cn(...classes) {
  const result = [];
  for (let i = 0; i < classes.length; i++) {
    if (classes[i]) {
      result.push(classes[i]);
    }
  }
  return result.join(' ');
}
/**
 * Returns combined Tailwind classes for a button element.
 *
 * @param {'primary'|'secondary'|'success'|'danger'|'outline'|'ghost'|'gradient'} [variant='primary']
 * @param {'sm'|'md'|'lg'} [size='md']
 * @param {string} [className=''] - Additional classes
 * @returns {string}
 */
export function getButtonClasses(
  variant = 'primary',
  size = 'md',
  className = ''
) {
  return cn(
    classNames.button.base,
    classNames.button[variant],
    classNames.button.size[size],
    className
  );
}
/**
 * Returns combined Tailwind classes for a card element.
 *
 * @param {boolean} [gradient=false] - Use gradient background
 * @param {boolean} [glass=false] - Use glass background
 * @param {'sm'|'md'|'lg'} [padding='md']
 * @param {string} [className=''] - Additional classes
 * @returns {string}
 */
export function getCardClasses(
  gradient = false,
  glass = false,
  padding = 'md',
  className = ''
) {
  const gradientClass = gradient ? classNames.card.gradient : '';
  const backgroundClass = glass
    ? classNames.card.glass
    : classNames.card.border;
  return cn(
    classNames.card.base,
    gradientClass,
    backgroundClass,
    classNames.card.padding[padding],
    className
  );
}
/**
 * Returns combined Tailwind classes for an input element.
 *
 * @param {'normal'|'error'|'success'} [state='normal']
 * @param {string} [className=''] - Additional classes
 * @returns {string}
 */
export function getInputClasses(state = 'normal', className = '') {
  let stateClass = '';
  if (state === 'error') {
    stateClass = classNames.input.error;
  } else if (state === 'success') {
    stateClass = classNames.input.success;
  }
  return cn(classNames.input.base, stateClass, className);
}
