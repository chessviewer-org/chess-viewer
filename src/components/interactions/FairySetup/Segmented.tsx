import type { ReactNode } from 'react';
import styles from './styles/segmented.module.scss';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly {
    value: T;
    label: ReactNode;
    title?: string;
    ariaLabel?: string;
  }[];
  onChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className = ''
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`${styles.group} ${className}`}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          title={option.title}
          aria-label={option.ariaLabel}
          aria-checked={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          className={styles.option}
          onClick={() => onChange(option.value)}
          onKeyDown={(event) => {
            let next: number;
            switch (event.key) {
              case 'ArrowRight':
              case 'ArrowDown':
                next = (index + 1) % options.length;
                break;
              case 'ArrowLeft':
              case 'ArrowUp':
                next = (index + options.length - 1) % options.length;
                break;
              case 'Home':
                next = 0;
                break;
              case 'End':
                next = options.length - 1;
                break;
              default:
                return;
            }
            event.preventDefault();
            if (event.repeat) return;
            onChange(options[next]!.value);
            const radios =
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                '[role="radio"]'
              );
            radios?.[next]?.focus();
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
