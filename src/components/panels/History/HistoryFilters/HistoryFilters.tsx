import { memo, useCallback, useState } from 'react';

import {
  CircleCheck,
  Clock,
  Download,
  Edit,
  Filter,
  Hourglass,
  MousePointer,
  Search,
  X
} from 'lucide-react';

import { CustomSelect, DatePicker } from '@shared/ui';

/** Active filter criteria for the FEN history list. */
export interface HistoryFilterState {
  fenSearch?: string | undefined;
  status?: string | undefined;
  source?: string | undefined;
  favoritesOnly?: boolean | undefined;
  dateFrom?: number | undefined;
  dateTo?: number | undefined;
}

/** Props for the `HistoryFilters` filter bar. */
export interface HistoryFiltersProps {
  filters: HistoryFilterState;
  onFiltersChange: (filters: HistoryFilterState) => void;
  showStatus?: boolean;
  showFavoritesCheckbox?: boolean;
}

const HistoryFilters = memo(function HistoryFilters({
  filters,
  onFiltersChange,
  showStatus = true,
  showFavoritesCheckbox = true
}: HistoryFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleFenSearch = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        fenSearch: value || undefined
      });
    },
    [filters, onFiltersChange]
  );
  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: value || undefined
      });
    },
    [filters, onFiltersChange]
  );
  const handleSourceChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        source: value || undefined
      });
    },
    [filters, onFiltersChange]
  );
  const handleFavoritesToggle = useCallback(
    (value: boolean) => {
      onFiltersChange({
        ...filters,
        favoritesOnly: value || undefined
      });
    },
    [filters, onFiltersChange]
  );
  const clearFilters = useCallback(() => {
    onFiltersChange({});
    setIsExpanded(false);
  }, [onFiltersChange]);
  const hasActiveFilters = Object.keys(filters).length > 0;
  const statusOptions = [
    {
      value: '',
      label: 'All Status',
      icon: <Filter className="w-3.5 h-3.5 text-text-muted" />
    },
    {
      value: 'green',
      label: 'Fresh (< 7 days)',
      icon: <CircleCheck className="w-3.5 h-3.5 text-success" />
    },
    {
      value: 'yellow',
      label: 'Aging (< 30 days)',
      icon: <Clock className="w-3.5 h-3.5 text-warning" />
    },
    {
      value: 'red',
      label: 'Stale (< 90 days)',
      icon: <Hourglass className="w-3.5 h-3.5 text-error" />
    }
  ];
  const sourceOptions = [
    {
      value: '',
      label: 'All Sources',
      icon: <Filter className="w-3.5 h-3.5 text-text-muted" />
    },
    {
      value: 'manual',
      label: 'Manual Input',
      icon: <Edit className="w-3.5 h-3.5 text-text-muted" />
    },
    {
      value: 'export',
      label: 'Export',
      icon: <Download className="w-3.5 h-3.5 text-text-muted" />
    },
    {
      value: 'drag',
      label: 'Drag & Drop',
      icon: <MousePointer className="w-3.5 h-3.5 text-text-muted" />
    }
  ];
  return (
    <div className="bg-surface-elevated border-b border-border">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search FEN positions..."
              value={filters.fenSearch || ''}
              onChange={(e) => handleFenSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isExpanded || hasActiveFilters ? 'bg-accent text-bg' : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-border'}`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && !isExpanded && (
              <span className="bg-surface-elevated text-text-primary w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center">
                {Object.keys(filters).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="p-2.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
              aria-label="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand/collapse with a grid-rows height animation: the row track
            grows 0fr→1fr (opens top-down) and shrinks 1fr→0fr (closes
            bottom-up). Pure CSS, no layout thrash, honours reduced-motion via
            the global transition reset. */}
        <div
          className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
          style={{
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            opacity: isExpanded ? 1 : 0
          }}
          aria-hidden={!isExpanded}
        >
          <div className="overflow-hidden min-h-0">
            <div
              className={`mt-4 grid grid-cols-1 sm:grid-cols-2 ${showStatus ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 pt-4 border-t border-border`}
            >
              {showStatus && (
                <CustomSelect
                  value={filters.status || ''}
                  onChange={handleStatusChange}
                  options={statusOptions}
                  placeholder="All Status"
                  label="Status"
                />
              )}

              <CustomSelect
                value={filters.source || ''}
                onChange={handleSourceChange}
                options={sourceOptions}
                placeholder="All Sources"
                label="Source"
              />

              <DatePicker
                value={filters.dateFrom}
                onChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    dateFrom: value
                  })
                }
                placeholder="Start date"
                label="Date From"
              />

              <DatePicker
                value={filters.dateTo}
                onChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    dateTo: value
                  })
                }
                placeholder="End date"
                label="Date To"
              />

              {showFavoritesCheckbox && (
                <div
                  className={`${showStatus ? 'sm:col-span-2 lg:col-span-4' : 'sm:col-span-2 lg:col-span-3'}`}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.favoritesOnly || false}
                      onChange={(e) => handleFavoritesToggle(e.target.checked)}
                      className="w-4 h-4 text-accent bg-surface border-border rounded focus:ring-2 focus:ring-accent"
                    />
                    <span className="text-sm font-medium text-text-primary">
                      Show favorites only
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
HistoryFilters.displayName = 'HistoryFilters';
export default HistoryFilters;
