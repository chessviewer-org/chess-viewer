import { memo, useCallback } from 'react';

import {
  CircleCheck,
  Clock,
  Download,
  Edit,
  Filter,
  Hourglass,
  MousePointer,
  Search
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
interface HistoryFiltersProps {
  filters: HistoryFilterState;
  onFiltersChange: (filters: HistoryFilterState) => void;
  showStatus?: boolean;
}

const HistoryFilters = memo(function HistoryFilters({
  filters,
  onFiltersChange,
  showStatus = true
}: HistoryFiltersProps) {
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
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search FEN..."
          value={filters.fenSearch ?? ''}
          onChange={(e) => handleFenSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
        />
      </div>

      {/* Status — only when showing active tab */}
      {showStatus && (
        <CustomSelect
          value={filters.status ?? ''}
          onChange={handleStatusChange}
          options={statusOptions}
          placeholder="Status"
          label=""
        />
      )}

      {/* Source */}
      <CustomSelect
        value={filters.source ?? ''}
        onChange={handleSourceChange}
        options={sourceOptions}
        placeholder="Source"
        label=""
      />

      {/* Date From — dropdown anchored to left edge of trigger */}
      <DatePicker
        value={filters.dateFrom}
        onChange={(value) => onFiltersChange({ ...filters, dateFrom: value })}
        placeholder="From"
        label=""
        align="right"
      />

      {/* Date To — dropdown anchored to right edge of trigger, opens leftward */}
      <DatePicker
        value={filters.dateTo}
        onChange={(value) => onFiltersChange({ ...filters, dateTo: value })}
        placeholder="To"
        label=""
        align="right"
      />
    </div>
  );
});

HistoryFilters.displayName = 'HistoryFilters';
export default HistoryFilters;
