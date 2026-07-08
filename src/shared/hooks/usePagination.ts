import { useCallback, useEffect, useState } from 'react';

const SWIPE_THRESHOLD = 40;

export interface PaginationState {
  page: number;
  pageCount: number;
  goTo: (page: number) => void;
  next: () => void;
  prev: () => void;
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

export function usePagination(
  itemCount: number,
  perPage: number
): PaginationState {
  const pageCount = Math.max(1, Math.ceil(itemCount / Math.max(1, perPage)));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const goTo = useCallback(
    (next: number) => {
      setPage(Math.min(Math.max(0, next), pageCount - 1));
    },
    [pageCount]
  );

  const next = useCallback(() => {
    setPage((p) => (p + 1) % pageCount);
  }, [pageCount]);

  const prev = useCallback(() => {
    setPage((p) => (p - 1 + pageCount) % pageCount);
  }, [pageCount]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null) return;
      const endX = e.changedTouches[0]?.clientX ?? touchStartX;
      const delta = endX - touchStartX;
      setTouchStartX(null);
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      if (delta < 0) next();
      else prev();
    },
    [touchStartX, next, prev]
  );

  return {
    page,
    pageCount,
    goTo,
    next,
    prev,
    swipeHandlers: { onTouchStart, onTouchEnd }
  };
}
