import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';

import { CheckCircle, ChevronDown, SearchX } from 'lucide-react';

import { useListboxKeyboard } from '@hooks';

export interface SearchableSelectOption {
  id: string;
  name: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  emptyMessage?: string;
}

/**
 * @param {SearchableSelectProps} props
 * @returns {JSX.Element}
 */
function SearchableSelect({
  options,
  value,
  onChange,
  label,
  placeholder = 'Search...',
  emptyMessage = 'No results found'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const labelId = `${baseId}-label`;

  const selectedOption = options.find((opt) => opt.id === value);
  let displayOptions: SearchableSelectOption[];

  if (search.trim() === '') {
    displayOptions = [
      ...(selectedOption ? [selectedOption] : []),
      ...options.filter((opt) => opt.id !== value)
    ];
  } else {
    displayOptions = options.filter((opt) =>
      opt.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  const selectedIndex = displayOptions.findIndex((opt) => opt.id === value);

  const handleSelectByIndex = useCallback(
    (index: number) => {
      const option = displayOptions[index];
      if (!option) return;
      onChange(option.id);
      setIsOpen(false);
      setSearch('');
    },
    [displayOptions, onChange]
  );

  // Type-ahead is intentionally disabled (getOptionLabel omitted): the search
  // input already filters by keystroke, so arrow keys + Enter are enough.
  const { activeIndex, setActiveIndex, onKeyDown } = useListboxKeyboard({
    isOpen,
    optionCount: displayOptions.length,
    selectedIndex,
    onOpen: () => setIsOpen(true),
    onClose: () => {
      setIsOpen(false);
      setSearch('');
    },
    onSelect: handleSelectByIndex
  });

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(
      `[data-option-index="${activeIndex}"]`
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined;

  return (
    <div className="space-y-3">
      {label && (
        <label
          id={labelId}
          className="block text-sm font-semibold text-text-secondary"
        >
          {label}
        </label>
      )}
      <div className="select-container">
        <div
          className={`relative select-custom w-full px-4 py-3 pr-12 bg-surface-hover border border-border text-sm text-text-primary text-left font-medium transition-colors duration-200 ${isOpen ? 'rounded-t-xl rounded-b-none border-b-0' : 'rounded-xl hover:border-border'}`}
        >
          {!isOpen && selectedOption ? (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              {...(label ? { 'aria-labelledby': labelId } : {})}
              className="w-full text-left bg-transparent border-none outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 rounded font-semibold text-text-primary"
            >
              {selectedOption.name}
            </button>
          ) : (
            <input
              type="search"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={() => setIsOpen(true)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={onKeyDown}
              autoFocus
              spellCheck={false}
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-autocomplete="list"
              {...(activeOptionId
                ? { 'aria-activedescendant': activeOptionId }
                : {})}
              {...(label ? { 'aria-labelledby': labelId } : {})}
              className="w-full bg-transparent border-none outline-none caret-accent text-text-primary placeholder-text-muted"
            />
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0 bg-transparent border-none"
          >
            <ChevronDown
              className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          {...(label ? { 'aria-labelledby': labelId } : {})}
          aria-hidden={!isOpen}
          className={`w-full bg-surface-elevated border border-border border-t-0 rounded-b-xl transition-[opacity,transform,max-height] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] origin-top select-custom ${isOpen ? 'opacity-100 translate-y-0 max-h-60 overflow-y-auto' : 'opacity-0 -translate-y-1 max-h-0 overflow-hidden pointer-events-none'}`}
        >
          {displayOptions.length === 0 && search.trim() !== '' && (
            <li className="px-4 py-3 flex items-center text-sm text-error gap-2 select-none">
              <SearchX aria-hidden="true" className="w-5 h-5 text-error/70" />
              <span className="font-medium">{emptyMessage}</span>
            </li>
          )}

          {displayOptions.map((option, index) => {
            const isSelected = option.id === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.id}
                id={`${baseId}-option-${index}`}
                data-option-index={index}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  // Prevent the input losing focus before the click commits.
                  e.preventDefault();
                  handleSelectByIndex(index);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`group px-4 py-3 cursor-pointer flex justify-between items-center transition-colors duration-200 ${isActive ? 'bg-accent/10' : ''} ${isSelected ? 'text-accent font-semibold' : 'text-text-secondary'}`}
              >
                <span>{option.name}</span>
                {isSelected && (
                  <CheckCircle
                    aria-hidden="true"
                    className="w-4 h-4 text-accent"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default memo(SearchableSelect);
