import { useCallback, useEffect, useState } from 'react';

/** Minimum horizontal travel (px) to count a touch drag as a swipe. */
const SWIPE_THRESHOLD = 40;

export interface PagedCarousel {
  /** Current page index (0-based). */
  page: number;
  /** Total number of pages (always ≥ 1). */
  pageCount: number;
  /** Jump to a specific page (clamped to range). */
  goTo: (page: number) => void;
  /** Advance one page, wrapping from the last back to the first. */
  next: () => void;
  /** Go back one page, wrapping from the first to the last. */
  prev: () => void;
  /** Touch handlers to spread onto the swipeable element. */
  swipeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

/**
 * Circular paging for a grid/carousel: arrow-key + button navigation on
 * desktop, touch-swipe on mobile/tablet, and wrap-around at both ends so a
 * second swipe past the edge loops back to the start (or end).
 *
 * `pageCount` is derived from `itemCount` / `perPage`; the page index is clamped
 * whenever those shrink so it never points past the last page.
 */
export function usePagedCarousel(
  itemCount: number,
  perPage: number
): PagedCarousel {
  const pageCount = Math.max(1, Math.ceil(itemCount / Math.max(1, perPage)));
  const [page, setPage] = useState(0);

  // Clamp when the page count shrinks (e.g. perPage grows on resize).
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const goTo = useCallback(
    (next: number) => {
      setPage(Math.min(Math.max(0, next), pageCount - 1));
    },
    [pageCount]
  );

  // Wrap-around so swiping/arrowing past an edge loops (circular).
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
      // Swipe left → next page; swipe right → previous page. Both wrap.
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
