import { memo, useEffect, useRef, useState } from 'react';

import { usePieceImages } from '@hooks';
import { BaseHistoryEntry } from '@app-types';

import { TabType } from '../hooks/useFENHistoryPage';
import { FENHistoryGridItem } from './FENHistoryGridItem';

/** Props for the responsive FEN history grid. */
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
 * How many cards to mount initially, and how many more to reveal each time the
 * scroll sentinel comes into view. Each card mounts a live `<canvas>`, so the
 * grid windows the list — only the cards scrolled into view ever mount, which
 * bounds canvas/GPU memory regardless of how large the history is. The grid
 * still flows in the page's own single scroll region (no inner scrollbar), so
 * the responsive multi-column layout and single-surface scroll are preserved.
 */
const PAGE_SIZE = 24;

/**
 * Responsive grid of FEN history cards with scroll-driven windowing. Renders a
 * capped page of cards and grows it as the user scrolls (via an
 * `IntersectionObserver` sentinel) so only visible cards mount a canvas.
 * `usePieceImages` is hoisted here and the loaded images are passed to every
 * card, instead of each card running its own preload hook.
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
  const { pieceImages, isLoading } = usePieceImages(pieceStyle);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset the window whenever the list itself changes (tab switch, filter,
  // delete) so we don't keep a stale-large window mounted against a smaller list.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [data]);

  const hasMore = visibleCount < data.length;

  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, data.length));
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, data.length]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {data.slice(0, visibleCount).map((entry, index) => (
          <FENHistoryGridItem
            key={entry.id}
            entry={entry}
            index={index}
            activeTab={activeTab}
            lightSquare={lightSquare}
            darkSquare={darkSquare}
            pieceImages={pieceImages}
            piecesLoading={isLoading}
            formatDate={formatDate}
            formatTime={formatTime}
            handleReactivate={handleReactivate}
            handleDelete={handleDelete}
            handleLoad={handleLoad}
            handleToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>
      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
    </>
  );
});
