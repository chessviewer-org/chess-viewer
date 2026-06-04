import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { List, RowComponentProps } from 'react-window';

import { BaseHistoryEntry } from '@app-types/history';

import { TabType } from '../hooks/useFENHistoryPage';
import { FENHistoryGridItem } from './FENHistoryGridItem';

/** Tailwind breakpoint → column count, mirroring the static grid classes
 *  (grid-cols-1 sm:2 md:3 lg:4 xl:5) so the virtualized layout matches. */
function columnsForWidth(width: number): number {
  if (width >= 1280) return 5; // xl
  if (width >= 1024) return 4; // lg
  if (width >= 768) return 3; // md
  if (width >= 640) return 2; // sm
  return 1;
}

const GAP_PX = 16; // matches gap-4 at the virtualized (>=sm) breakpoints
// Card height = square board preview (= column width) + fixed footer block.
const CARD_FOOTER_PX = 132;

/** Shared props passed to every virtualized row. */
interface RowData {
  rows: BaseHistoryEntry[][];
  columns: number;
  activeTab: TabType;
  lightSquare: string;
  darkSquare: string;
  pieceStyle: string;
  formatDate: (ts: number) => string;
  formatTime: (ts: number) => string;
  handleReactivate: (id: number) => void;
  handleDelete: (id: number) => void;
  handleLoad: (fen: string) => void;
  handleToggleFavorite: (id: number) => void;
}

function GridRow({
  index,
  style,
  rows,
  columns,
  activeTab,
  lightSquare,
  darkSquare,
  pieceStyle,
  formatDate,
  formatTime,
  handleReactivate,
  handleDelete,
  handleLoad,
  handleToggleFavorite
}: RowComponentProps<RowData>) {
  const rowEntries = rows[index] ?? [];
  return (
    <div style={style}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: GAP_PX,
          paddingBottom: GAP_PX
        }}
      >
        {rowEntries.map((entry, col) => (
          <FENHistoryGridItem
            key={entry.id}
            entry={entry}
            index={index * columns + col}
            activeTab={activeTab}
            lightSquare={lightSquare}
            darkSquare={darkSquare}
            pieceStyle={pieceStyle}
            formatDate={formatDate}
            formatTime={formatTime}
            handleReactivate={handleReactivate}
            handleDelete={handleDelete}
            handleLoad={handleLoad}
            handleToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}

/** Props for the virtualized FEN history grid. */
interface FENHistoryGridProps {
  data: BaseHistoryEntry[];
  activeTab: TabType;
  lightSquare: string;
  darkSquare: string;
  pieceStyle: string;
  formatDate: (ts: number) => string;
  formatTime: (ts: number) => string;
  handleReactivate: (id: number) => void;
  handleDelete: (id: number) => void;
  handleLoad: (fen: string) => void;
  handleToggleFavorite: (id: number) => void;
}

/**
 * Virtualized responsive grid of FEN history cards. Chunks entries into rows
 * sized to the measured container width so only visible rows mount, keeping the
 * DOM bounded for large histories (react-window has no built-in multi-column
 * grid in v2, so rows are built manually).
 */
export const FENHistoryGrid = memo(function FENHistoryGrid({
  data,
  activeTab,
  lightSquare,
  darkSquare,
  pieceStyle,
  formatDate,
  formatTime,
  handleReactivate,
  handleDelete,
  handleLoad,
  handleToggleFavorite
}: FENHistoryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columns = size.width > 0 ? columnsForWidth(size.width) : 1;
  const columnWidth =
    columns > 0 ? (size.width - GAP_PX * (columns - 1)) / columns : size.width;
  const rowHeight =
    Math.max(1, Math.round(columnWidth + CARD_FOOTER_PX)) + GAP_PX;

  const rows = useMemo(() => {
    const chunked: BaseHistoryEntry[][] = [];
    for (let i = 0; i < data.length; i += columns) {
      chunked.push(data.slice(i, i + columns));
    }
    return chunked;
  }, [data, columns]);

  const rowProps: RowData = {
    rows,
    columns,
    activeTab,
    lightSquare,
    darkSquare,
    pieceStyle,
    formatDate,
    formatTime,
    handleReactivate,
    handleDelete,
    handleLoad,
    handleToggleFavorite
  };

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.width > 0 && (
        <List
          rowCount={rows.length}
          rowHeight={rowHeight}
          rowProps={rowProps}
          rowComponent={GridRow}
          style={{ height: size.height, width: '100%' }}
        />
      )}
    </div>
  );
});
