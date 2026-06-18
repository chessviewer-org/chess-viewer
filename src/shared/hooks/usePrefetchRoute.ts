import { useCallback } from 'react';

import { prefetchByPath } from '@/routes/prefetchRegistry';

// Module-level so the guard is shared across every hook consumer: a chunk is
// prefetched at most once per session regardless of which link triggers it.
const prefetched = new Set<string>();

/**
 * Returns event handlers that prefetch a route's lazy chunk on hover/focus.
 *
 * Spread the result onto a navigation `<Link>`:
 *
 * ```tsx
 * <Link to="/advanced-fen" {...usePrefetchRoute()('/advanced-fen')}>…</Link>
 * ```
 *
 * The query string is stripped, so `/settings?tab=data` maps to `/settings`.
 * No-ops for unknown paths and after the first prefetch of a given route.
 */
export function usePrefetchRoute() {
  return useCallback((to: string) => {
    const path = to.split('?')[0] ?? to;
    const prefetch = () => {
      if (prefetched.has(path)) return;
      const factory = prefetchByPath[path];
      if (!factory) return;
      prefetched.add(path);
      // Fire-and-forget: a failed prefetch must not surface to the user; the
      // real navigation import will retry and report errors normally.
      void factory().catch(() => prefetched.delete(path));
    };
    return { onMouseEnter: prefetch, onFocus: prefetch };
  }, []);
}
