import { memo } from 'react';

import {
  ArrowUpRight,
  ChessKing,
  Database,
  Globe,
  Library,
  Loader2,
  Search
} from 'lucide-react';

import type { ProviderState } from '@hooks';

import styles from '../database-search.module.scss';

interface DatabaseSearchPanelProps {
  lichess: ProviderState;
  chessdb: ProviderState;
  pdb: ProviderState;
  yacpdb: ProviderState;
  /**
   * Fired when a SLOW provider (PDB/YACPDB) search is triggered, so the caller
   * can warn the user the lookup may take a while. Not fired for the fast
   * providers (Lichess/ChessDB). Must be referentially stable (panel is memo'd).
   */
  onSlowSearch?: () => void;
  className?: string;
}

const SearchActionButton = memo(function SearchActionButton({
  state,
  onBeforeSearch
}: {
  state: ProviderState;
  /** Runs before this provider's `search()` (e.g. a slow-lookup warning). */
  onBeforeSearch?: () => void;
}) {
  const { status, url } = state;

  if (status === 'found' && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex shrink-0 items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-bg bg-accent hover:bg-accent-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]"
        aria-label={`Open ${state.label} result in a new tab`}
      >
        <span>Open</span>
        <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
      </a>
    );
  }

  const searching = status === 'searching';
  const label =
    status === 'notfound'
      ? 'No match'
      : status === 'error'
        ? 'Retry'
        : searching
          ? 'Searching…'
          : 'Search';

  const handleClick = (): void => {
    onBeforeSearch?.();
    state.search();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={searching}
      className={`flex shrink-0 items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        searching
          ? 'cursor-not-allowed border-border/50 bg-surface text-yellow-500'
          : status === 'notfound'
            ? 'border-border/50 bg-surface text-text-secondary hover:bg-surface-hover'
            : 'border-accent/30 bg-accent/5 text-accent hover:bg-accent/10 active:scale-[0.98]'
      }`}
      aria-label={`Search ${state.label}`}
    >
      {searching ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
      ) : (
        <Search className="w-3.5 h-3.5" strokeWidth={2.5} />
      )}
      <span>{label}</span>
    </button>
  );
});

const ProviderRow = memo(function ProviderRow({
  state,
  Icon,
  onBeforeSearch
}: {
  state: ProviderState;
  Icon: React.ElementType;
  /** Forwarded to the button; set only for slow providers (PDB/YACPDB). */
  onBeforeSearch?: () => void;
}) {
  const found = state.status === 'found';
  return (
    <div className={styles.providerRow}>
      <div className={styles.providerMeta}>
        <Icon
          className={`${styles.providerIcon} ${found ? styles.found : ''}`}
          strokeWidth={found ? 2.5 : 2}
          aria-hidden="true"
        />
        <span
          className={`${styles.providerLabel} ${found ? styles.found : ''}`}
        >
          {state.label}
        </span>
      </div>
      <SearchActionButton
        state={state}
        {...(onBeforeSearch ? { onBeforeSearch } : {})}
      />
    </div>
  );
});

const DatabaseSearchPanel = memo(function DatabaseSearchPanel({
  lichess,
  chessdb,
  pdb,
  yacpdb,
  onSlowSearch,
  className = ''
}: DatabaseSearchPanelProps) {
  // Only PDB/YACPDB are slow problem databases — warn before those lookups.
  const slow = onSlowSearch ? { onBeforeSearch: onSlowSearch } : {};
  return (
    <div className={`${styles.panel} ${className}`}>
      <span className={styles.title}>Database Search</span>
      <div className={styles.grid}>
        <ProviderRow state={lichess} Icon={Globe} />
        <ProviderRow state={chessdb} Icon={Database} />
        <ProviderRow state={pdb} Icon={ChessKing} {...slow} />
        <ProviderRow state={yacpdb} Icon={Library} {...slow} />
      </div>
    </div>
  );
});

DatabaseSearchPanel.displayName = 'DatabaseSearchPanel';

export default DatabaseSearchPanel;
