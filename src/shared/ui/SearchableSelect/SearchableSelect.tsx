import { memo, useState } from 'react';

import { CheckCircle, ChevronDown, SearchX } from 'lucide-react';

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

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-semibold text-text-secondary">
          {label}
        </label>
      )}
      <div className="select-container">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            outline: 'none',
            boxShadow: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          className={`relative select-custom w-full px-4 py-3 pr-12 bg-surface-hover border border-border text-sm text-text-primary text-left font-medium cursor-pointer transition-colors duration-200 ${isOpen ? 'rounded-t-xl rounded-b-none border-b-0' : 'rounded-xl hover:border-accent/50'}`}
        >
          {!isOpen && selectedOption ? (
            <span className="font-semibold hover:text-accent transition-colors">
              {selectedOption.name}
            </span>
          ) : (
            <input
              type="search"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              spellCheck={false}
              className="w-full bg-transparent border-none outline-none caret-accent text-text-primary placeholder-text-muted"
            />
          )}

          <ChevronDown
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted cursor-pointer transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <ul
          className={`w-full bg-surface-elevated border border-border border-t-0 rounded-b-xl transition-[opacity,transform,max-height] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] origin-top select-custom ${isOpen ? 'opacity-100 translate-y-0 max-h-60 overflow-y-auto' : 'opacity-0 -translate-y-1 max-h-0 overflow-hidden pointer-events-none'}`}
        >
          {displayOptions.length === 0 && search.trim() !== '' && (
            <li className="px-4 py-3 flex items-center text-sm text-error gap-2 select-none">
              <SearchX className="w-5 h-5 text-error/70" />
              <span className="font-medium">{emptyMessage}</span>
            </li>
          )}

          {displayOptions.map((option) => {
            const isSelected = option.id === value;
            return (
              <li
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`group px-4 py-3 cursor-pointer flex justify-between items-center transition-colors duration-200 hover:bg-accent/10 ${isSelected ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <span>{option.name}</span>
                {isSelected && <CheckCircle className="w-4 h-4 text-accent" />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default memo(SearchableSelect);
