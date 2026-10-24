import { useCallback, useEffect, useRef, useState } from 'react';

const SWIPE_THRESHOLD = 40;

export interface PaginationState {
  page: number;
  pageCount: number;
  goTo: (page: number) => void;
  next: () => void;
  prev: () => void;
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
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

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.defaultPrevented) touchStart.current = null;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      const touch = e.changedTouches[0];
      if (!start || !touch) return;
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
      if (Math.abs(deltaY) > Math.abs(deltaX)) return;
      if (deltaX < 0) next();
      else prev();
    },
    [next, prev]
  );

  return {
    page,
    pageCount,
    goTo,
    next,
    prev,
    swipeHandlers: { onTouchStart, onTouchMove, onTouchEnd }
  };
}
