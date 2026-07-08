import { memo, useEffect, useRef, useState } from 'react';

import { usePieceImages } from '@/shared/hooks';
import { BaseHistoryEntry } from '@app-types';

import { TabType } from '../hooks/useFENHistoryPage';
import { FENHistoryGridItem } from './FENHistoryGridItem';

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

const PAGE_SIZE = 24;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
