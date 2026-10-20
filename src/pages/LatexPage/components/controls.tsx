import { memo, useId, type ReactNode } from 'react';

import { segmentButton } from '../utils/controlStyles';

const LABEL_CLASS =
  'text-[10px] uppercase font-bold tracking-wider text-text-muted';

const INPUT_CLASS =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50';

interface SectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string | undefined;
  children: ReactNode;
}

export const Section = memo(function Section({
  title,
  description,
  actions,
  className = '',
  children
}: SectionProps) {
  return (
    <section
      className={`@container flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 ${className}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-bold text-text-primary">{title}</h2>
          {description && (
            <p className="text-[11px] leading-relaxed text-text-muted">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </header>
      {children}
    </section>
  );
});

interface FieldProps {
  label: string;
  hint?: string | undefined;
  error?: string | null | undefined;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

export const Field = memo(function Field({
  label,
  hint,
  error,
  children
}: FieldProps) {
  const id = useId();
  const noteId = hint || error ? `${id}-note` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      {children(id, noteId)}
      {error ? (
        <p id={noteId} role="alert" className="text-[11px] text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p
            id={noteId}
            className="text-[11px] leading-relaxed text-text-muted"
          >
            {hint}
          </p>
        )
      )}
    </div>
  );
});

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string | undefined;
  error?: string | null | undefined;
  maxLength?: number;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
}

export const TextField = memo(function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  maxLength = 500,
  disabled,
  multiline,
  rows = 3,
  mono
}: TextFieldProps) {
  const className = `${INPUT_CLASS} ${mono ? 'font-mono text-xs' : ''} ${
    error ? 'border-error' : ''
  }`;
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, describedBy) =>
        multiline ? (
          <textarea
            id={id}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            value={value}
            rows={rows}
            maxLength={maxLength}
            disabled={disabled}
            placeholder={placeholder}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
            className={`${className} resize-y`}
          />
        ) : (
          <input
            id={id}
            type="text"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            value={value}
            maxLength={maxLength}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
            className={className}
          />
        )
      }
    </Field>
  );
});

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; hint?: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  hint?: string;
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
  hint
}: SegmentedProps<T>) {
  const id = useId();
  const active = options.find((option) => option.value === value);
  const note = hint ?? active?.hint;
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className={LABEL_CLASS}>
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={id}
        className="flex w-full overflow-hidden rounded-lg border border-border/60"
      >
        {options.map((option, index) => (
          <button
            key={String(option.value)}
            type="button"
            disabled={disabled}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={`${segmentButton(option.value === value)} ${
              index < options.length - 1 ? 'border-r border-border/60' : ''
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {note && (
        <p className="text-[11px] leading-relaxed text-text-muted">{note}</p>
      )}
    </div>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}

export const RangeField = memo(function RangeField({
  label,
  value,
  min,
  max,
  unit,
  onChange
}: RangeFieldProps) {
  return (
    <Field label={`${label} · ${value} ${unit}`}>
      {(id) => (
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-[var(--color-accent)]"
        />
      )}
    </Field>
  );
});

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorField = memo(function ColorField({
  label,
  value,
  onChange
}: ColorFieldProps) {
  return (
    <Field label={label}>
      {(id) => (
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full cursor-pointer rounded-lg border border-border bg-surface p-1"
        />
      )}
    </Field>
  );
});
