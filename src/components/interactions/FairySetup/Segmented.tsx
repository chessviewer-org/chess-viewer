import type { ReactNode } from 'react';

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: ReactNode; title?: string }[];
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
      role="group"
      aria-label={label}
      className={`grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-bg/50 p-1 ring-1 ring-border/70 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className="inline-flex h-8 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent aria-pressed:bg-surface-hover aria-pressed:text-text-primary aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-border"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
