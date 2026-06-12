import { memo } from 'react';

import { ArrowUpRight, Database, Loader2, Search } from 'lucide-react';

import type { ProviderState } from '@hooks/useDatabaseSearch';

/**
 * Dedicated Database Search panel (manual search only).
 *
 * Layout — four provider cells in a 2×2 grid, each independently triggered:
 *   ┌───────────────────────┬───────────────────────┐
 *   │ ◆ Lichess  [ Search ]  │ ◆ ChessDB  [ Search ]  │
 *   ├───────────────────────┼───────────────────────┤
 *   │ ◆ PDB      [ Search ]  │ ◆ YACPDB   [ Search ]  │
 *   └───────────────────────┴───────────────────────┘
 *
 * A provider that matched turns its icon + label GOLD and its action button
 * becomes an "Open ↗" external link. Colours use existing CSS-variable tokens.
 */
export interface DatabaseSearchPanelProps {
  lichess: ProviderState;
  chessdb: ProviderState;
  pdb: ProviderState;
  yacpdb: ProviderState;
  /** Extra classes for the outer card (e.g. `flex-1` to fill column height). */
  className?: string;
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
        className="flex shrink-0 items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-bg bg-accent hover:bg-accent-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]"
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
      className={`flex shrink-0 items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
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
    <div className="flex h-full items-center justify-between gap-1.5 min-w-0 px-2.5 py-2.5 rounded-lg border border-border/40 bg-surface">
      <div className="flex items-center gap-1.5 min-w-0">
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
  lichess,
  chessdb,
  pdb,
  yacpdb,
  className = ''
}: DatabaseSearchPanelProps) {
  return (
    <div
      className={`flex w-full flex-col rounded-xl border border-border/40 bg-surface-elevated px-2.5 py-2.5 ${className}`}
    >
      <span className="block shrink-0 text-fluid-xs font-bold uppercase tracking-wider text-text-secondary px-1 mb-2.5">
        Database Search
      </span>

      {/* 2×2 grid — each provider independently triggered. Top row: game
          databases (Lichess "who played this?" · ChessDB engine evals); bottom
          row: the problem databases PDB / YACPDB. `flex-1` + `auto-rows-fr` lets
          the two rows split the panel's full height evenly, so the provider
          cells grow taller when the editor gives this panel more room. */}
      <div className="grid flex-1 min-h-0 grid-cols-2 auto-rows-fr gap-2.5">
        <ProviderRow state={lichess} />
        <ProviderRow state={chessdb} />
        <ProviderRow state={pdb} />
        <ProviderRow state={yacpdb} />
      </div>
    </div>
  );
});

DatabaseSearchPanel.displayName = 'DatabaseSearchPanel';

export default DatabaseSearchPanel;
