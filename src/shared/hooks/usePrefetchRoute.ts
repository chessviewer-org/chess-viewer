import { useCallback } from 'react';

import { prefetchByPath } from '@/routes/lazyPages';

const prefetched = new Set<string>();

export function usePrefetchRoute() {
  return useCallback((to: string) => {
    const path = to.split('?')[0] ?? to;
    const prefetch = () => {
      if (prefetched.has(path)) return;
      const factory = prefetchByPath[path];
      if (!factory) return;
      prefetched.add(path);
      void factory().catch(() => prefetched.delete(path));
    };
    return { onMouseEnter: prefetch, onFocus: prefetch };
  }, []);
}
