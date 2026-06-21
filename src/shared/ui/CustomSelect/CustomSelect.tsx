import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

import { useEffectiveReducedMotion, useListboxKeyboard } from '@hooks';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
interface CustomSelectProps<T extends string | number> {
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
  const reduceMotion = useEffectiveReducedMotion();

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

  // Trigger + panel read as one connected control: when open, the trigger drops
  // its bottom radius and the panel drops its top radius + top border so they
  // visually fuse into a single rounded card.
  const triggerRadius = isOpen ? 'rounded-t-lg rounded-b-none' : 'rounded-lg';

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
        className={`relative z-10 w-full px-3 py-2 bg-surface border border-border text-sm text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 flex items-center justify-between gap-2 transition-colors ${triggerRadius} ${
          isOpen ? 'bg-surface-hover' : 'hover:bg-surface-hover'
        }`}
      >
        <div className="flex items-center gap-2">
          {displayIcon && <span className="shrink-0">{displayIcon}</span>}
          <span className={value ? 'text-text-primary' : 'text-text-muted'}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, height: 'auto', y: 0 }
            }
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
            }
            className="absolute z-50 w-full overflow-hidden rounded-b-lg border border-t-0 border-border bg-surface-elevated shadow-2xl"
          >
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
                      <Check
                        aria-hidden="true"
                        className="w-4 h-4 text-accent"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CustomSelect = memo(
  CustomSelectComponent
) as typeof CustomSelectComponent;
export default CustomSelect;
