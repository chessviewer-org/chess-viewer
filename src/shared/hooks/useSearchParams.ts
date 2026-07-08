import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export function useSearchParams() {
  const [search, setSearch] = useState(() => window.location.search);
  const [path] = useLocation();

  useEffect(() => {
    const handlePopState = () => setSearch(window.location.search);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    setSearch(window.location.search);
  }, [path]);

  const searchParams = new URLSearchParams(search);

  const setSearchParams = useCallback(
    (
      params:
        | Record<string, string>
        | ((prev: URLSearchParams) => URLSearchParams),
      options?: { replace?: boolean }
    ) => {
      const nextParams =
        typeof params === 'function'
          ? params(new URLSearchParams(window.location.search))
          : new URLSearchParams(params);

      const newSearch = nextParams.toString()
        ? `?${nextParams.toString()}`
        : '';
      const newUrl =
        window.location.pathname + newSearch + window.location.hash;

      if (options?.replace) {
        window.history.replaceState(null, '', newUrl);
      } else {
        window.history.pushState(null, '', newUrl);
      }
      setSearch(newSearch);
    },
    []
  );

  return [searchParams, setSearchParams] as const;
}
