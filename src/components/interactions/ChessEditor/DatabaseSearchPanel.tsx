import { memo } from 'react';

import { ArrowUpRight, Database, Loader2, Search } from 'lucide-react';

import type { ProviderState } from '@hooks/useDatabaseSearch';

/**
 * Dedicated Database Search panel (manual search only).
 *
 * Layout — two stacked provider rows, each independently triggered:
 *   ┌──────────────────────────────────────────┐
 *   │  ◆ PDB                       [ Search ]    │
 *   │  ◆ YACPDB                    [ Search ]    │
 *   └──────────────────────────────────────────┘
 *
 * A provider that matched turns its icon + label GOLD and its action button
 * becomes an "Open ↗" external link. Colours use existing CSS-variable tokens.
 */
export interface DatabaseSearchPanelProps {
  pdb: ProviderState;
  yacpdb: ProviderState;
}

/** Per-row action button: Search → Searching… (disabled) → Open ↗ (link). */
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
        className="flex items-center justify-center gap-1 px-3 py-1.5 min-w-[88px] rounded-lg text-xs font-bold text-bg bg-accent hover:bg-accent-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]"
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
      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 min-w-[88px] rounded-lg text-xs font-semibold border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        searching
          ? 'cursor-wait border-border/50 bg-surface text-text-muted'
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

/** A PDB/YACPDB row: icon + label (left, gold when found) · action (right). */
const ProviderRow = memo(function ProviderRow({
  state
}: {
  state: ProviderState;
}) {
  const found = state.status === 'found';
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-border/40 bg-surface">
      <div className="flex items-center gap-2 min-w-0">
        <Database
          className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
            found ? 'text-accent' : 'text-text-muted'
          }`}
          strokeWidth={found ? 2.5 : 2}
          aria-hidden="true"
        />
        <span
          className={`text-sm font-bold truncate transition-colors duration-300 ${
            found ? 'text-accent' : 'text-text-primary'
          }`}
        >
          {state.label}
        </span>
      </div>
      <SearchActionButton state={state} />
    </div>
  );
});

const DatabaseSearchPanel = memo(function DatabaseSearchPanel({
  pdb,
  yacpdb
}: DatabaseSearchPanelProps) {
  return (
    <div className="w-full rounded-xl border border-border/40 bg-surface-elevated px-2.5 py-2 space-y-2">
      <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-text-secondary px-1">
        Database Search
      </span>

      {/* Two stacked provider rows — each independently triggered. */}
      <ProviderRow state={pdb} />
      <ProviderRow state={yacpdb} />
    </div>
  );
});

DatabaseSearchPanel.displayName = 'DatabaseSearchPanel';

export default DatabaseSearchPanel;
