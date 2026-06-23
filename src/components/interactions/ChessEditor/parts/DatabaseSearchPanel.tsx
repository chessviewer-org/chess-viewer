import { memo } from 'react';

import {
  ArrowUpRight,
  ChessKing,
  Database,
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
  className?: string;
}

const LichessIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M10.457 6.161a.237.237 0 0 0-.296.165c-.8 2.785 2.819 5.579 5.214 7.428.653.504 1.216.939 1.591 1.292 1.745 1.642 2.564 2.851 2.733 3.178a.24.24 0 0 0 .275.122c.047-.013 4.726-1.3 3.934-4.574a.257.257 0 0 0-.023-.06L18.204 3.407 18.93.295a.24.24 0 0 0-.262-.293c-1.7.201-3.115.435-4.5 1.425-4.844-.323-8.718.9-11.213 3.539C.334 7.737-.246 11.515.085 14.128c.763 5.655 5.191 8.631 9.081 9.532.993.229 1.974.34 2.923.34 3.344 0 6.297-1.381 7.946-3.85a.24.24 0 0 0-.372-.3c-3.411 3.527-9.002 4.134-13.296 1.444-4.485-2.81-6.202-8.41-3.91-12.749C4.741 4.221 8.801 2.362 13.888 3.31c.056.01.115 0 .165-.029l.335-.197c.926-.546 1.961-1.157 2.873-1.279l-.694 1.993a.243.243 0 0 0 .02.202l6.082 10.192c-.193 2.028-1.706 2.506-2.226 2.611-.287-.645-.814-1.364-2.306-2.803-.422-.407-1.21-.941-2.124-1.56-2.364-1.601-5.937-4.02-5.391-5.984a.239.239 0 0 0-.165-.295z" />
  </svg>
);

const SearchActionButton = memo(function SearchActionButton({
  state
}: {
  state: ProviderState;
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

  return (
    <button
      type="button"
      onClick={state.search}
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
  Icon
}: {
  state: ProviderState;
  Icon: React.ElementType;
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
      <SearchActionButton state={state} />
    </div>
  );
});

const DatabaseSearchPanel = memo(function DatabaseSearchPanel({
  lichess,
  chessdb,
  pdb,
  yacpdb,
  className = ''
}: DatabaseSearchPanelProps) {
  return (
    <div className={`${styles.panel} ${className}`}>
      <span className={styles.title}>Database Search</span>
      <div className={styles.grid}>
        <ProviderRow state={lichess} Icon={LichessIcon} />
        <ProviderRow state={chessdb} Icon={Database} />
        <ProviderRow state={pdb} Icon={ChessKing} />
        <ProviderRow state={yacpdb} Icon={Library} />
      </div>
    </div>
  );
});

DatabaseSearchPanel.displayName = 'DatabaseSearchPanel';

export default DatabaseSearchPanel;
