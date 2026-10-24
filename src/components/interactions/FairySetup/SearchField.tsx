import { useId, useRef } from 'react';
import { Search, X } from '@/assets/icons';
import { CONTROL } from './controls';

interface SearchFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchField({
  label,
  placeholder,
  value,
  onChange
}: SearchFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <Search
        className="absolute left-3 top-3 w-4 h-4 text-text-secondary pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id={id}
        type="search"
        className={`${CONTROL} pl-9 pr-10 [&::-webkit-search-cancel-button]:appearance-none`}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          className="absolute right-0.5 top-0.5 min-w-9 min-h-9 cursor-pointer rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={`Clear ${label.toLowerCase()}`}
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
        >
          <X className="w-4 h-4 mx-auto" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
