import { memo, useMemo, useState } from 'react';

import { Check, ChevronRight } from '@/assets/icons';
import { FAIRY_CONDITIONS } from '@constants/fairyCatalogue';
import { SearchField } from './SearchField';
import styles from './styles/fairy-problem.module.scss';

const CONDITIONS = FAIRY_CONDITIONS.map((value) => ({
  value,
  search: value.toLowerCase()
}));

interface ConditionLibraryProps {
  selected: ReadonlySet<string>;
  onToggle: (condition: string) => void;
}

export const ConditionLibrary = memo(function ConditionLibrary({
  selected,
  onToggle
}: ConditionLibraryProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return CONDITIONS.filter(({ search }) => search.includes(term));
  }, [query]);

  return (
    <details
      className={styles.disclosure}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className={styles.summary}>
        <ChevronRight className={styles.chevron} aria-hidden="true" />
        <span className={styles.summaryTitle}>Condition library</span>
        <span className={styles.summaryMeta}>
          {selected.size
            ? `${selected.size} selected`
            : `${CONDITIONS.length} available`}
        </span>
      </summary>
      {open && (
        <div className={styles.libraryBody}>
          <div className={styles.libraryToolbar}>
            <SearchField
              label="Search fairy conditions"
              placeholder="Search by condition name"
              value={query}
              onChange={setQuery}
            />
            <span className={styles.resultCount} role="status">
              {matches.length}{' '}
              {matches.length === 1 ? 'condition' : 'conditions'}
            </span>
          </div>
          <div
            role="group"
            aria-label="Available fairy conditions"
            className={styles.conditionList}
          >
            {matches.map(({ value, search }) => (
              <button
                type="button"
                key={value}
                aria-pressed={selected.has(search)}
                className={styles.conditionOption}
                onClick={() => onToggle(value)}
              >
                <span className={styles.conditionCheck} aria-hidden="true">
                  <Check className="size-3" />
                </span>
                <span>{value}</span>
              </button>
            ))}
            {matches.length === 0 && (
              <p className={styles.emptyState}>
                No conditions match “{query.trim()}”. Try another name.
              </p>
            )}
          </div>
        </div>
      )}
    </details>
  );
});
