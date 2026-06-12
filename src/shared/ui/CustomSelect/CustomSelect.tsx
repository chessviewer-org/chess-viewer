import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';

import { Check, ChevronDown } from 'lucide-react';

import { useListboxKeyboard } from '@hooks';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
export interface CustomSelectProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; icon?: React.ReactNode }>;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
}

const CustomSelectComponent = <T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  label,
  icon
}: CustomSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  const selectedIndex = options.findIndex((opt) => opt.value === value);

  const handleSelectByIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      setIsOpen(false);
    },
    [onChange, options]
  );

  const { activeIndex, setActiveIndex, onKeyDown } = useListboxKeyboard({
    isOpen,
    optionCount: options.length,
    selectedIndex,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    onSelect: handleSelectByIndex,
    getOptionLabel: (index) => options[index]?.label ?? ''
  });

  // Keep the active option scrolled into view as the user arrows through.
  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const selectedOption =
    selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const displayIcon = selectedOption?.icon || icon;
  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined;

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label
          id={`${baseId}-label`}
          className="block text-xs font-semibold text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        {...(activeOptionId ? { 'aria-activedescendant': activeOptionId } : {})}
        {...(label ? { 'aria-labelledby': `${baseId}-label` } : {})}
        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 flex items-center justify-between gap-2 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          {displayIcon && <span className="shrink-0">{displayIcon}</span>}
          <span className={value ? 'text-text-primary' : 'text-text-muted'}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-surface-elevated border border-border rounded-lg shadow-2xl overflow-hidden animate-scaleIn origin-top">
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            {...(label ? { 'aria-labelledby': `${baseId}-label` } : {})}
            className="py-1 max-h-64 overflow-y-auto"
          >
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              const isActive = index === activeIndex;
              return (
                <button
                  key={option.value}
                  id={`${baseId}-option-${index}`}
                  data-option-index={index}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onClick={() => handleSelectByIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`
                    w-full px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors
                    ${isSelected ? 'bg-accent/10 text-accent' : 'text-text-primary'}
                    ${isActive ? 'bg-surface-hover' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {option.icon && (
                      <span className="shrink-0">{option.icon}</span>
                    )}
                    <span>{option.label}</span>
                  </div>
                  {isSelected && (
                    <Check aria-hidden="true" className="w-4 h-4 text-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const CustomSelect = memo(
  CustomSelectComponent
) as typeof CustomSelectComponent;
export default CustomSelect;
