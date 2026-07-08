import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';

import { Check, ChevronDown } from '@/assets/icons';

import { useListboxKeyboard, useOutsideClick } from '@/shared/hooks';
import styles from '../styles/ui.module.scss';

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

  useOutsideClick(containerRef, () => setIsOpen(false), isOpen);

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

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const selectedOption =
    selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const displayIcon = selectedOption?.icon ?? icon;
  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined;

  // const triggerRadius = isOpen ? 'rounded-t-lg rounded-b-none' : 'rounded-lg';

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label id={`${baseId}-label`} className={styles['selectLabel']}>
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
        className={`${styles['selectTrigger']} ${
          isOpen ? styles['selectTriggerOpen'] : styles['selectTriggerClosed']
        }`}
      >
        <div className="flex items-center gap-2">
          {displayIcon && <span className="shrink-0">{displayIcon}</span>}
          <span className={value ? 'text-text-primary' : 'text-text-muted'}>
            {selectedOption?.label ?? placeholder}
          </span>
        </div>
        <ChevronDown
          aria-hidden="true"
          className={`${styles['selectIcon']} ${isOpen ? styles['selectIconOpen'] : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles['selectDropdown']}>
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            {...(label ? { 'aria-labelledby': `${baseId}-label` } : {})}
            className={styles['selectList']}
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
                  className={`${styles['selectOption']} ${isSelected ? styles['selectOptionSelected'] : styles['selectOptionUnselected']} ${isActive ? styles['selectOptionActive'] : ''}`}
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
