import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type DatabaseProvider,
  PROVIDER_LABEL,
  searchPositionDatabases
} from '@/shared/utils/databaseSearch';
import { isFairyFEN, validateFEN } from '@/shared/utils/fenParser';

// Types
type ProviderSearchStatus =
  'idle' | 'searching' | 'found' | 'notfound' | 'error';

export interface ProviderState {
  status: ProviderSearchStatus;
  label: string;
  url: string | null;
  search: () => void;
}

export interface UseDatabaseSearchResult {
  lichess: ProviderState;
  chessdb: ProviderState;
  searchAll: () => void;
}

// Constants
const PROVIDERS: DatabaseProvider[] = ['lichess', 'chessdb'];

interface ProviderData {
  status: ProviderSearchStatus;
  url: string | null;
}

const IDLE_STATE: Record<DatabaseProvider, ProviderData> = {
  lichess: { status: 'idle', url: null },
  chessdb: { status: 'idle', url: null }
};

export function useDatabaseSearch(fen: string): UseDatabaseSearchResult {
  const [results, setResults] = useState(IDLE_STATE);
  const currentFenRef = useRef(fen);

  useEffect(() => {
    currentFenRef.current = fen;
    setResults(IDLE_STATE);
  }, [fen]);

  const run = useCallback(
    async (targets: readonly DatabaseProvider[]) => {
      const trimmed = fen.trim();
      if (!trimmed || isFairyFEN(trimmed) || !validateFEN(trimmed)) return;

      setResults((prev) => {
        const next = { ...prev };
        for (const provider of targets) {
          next[provider] = { ...next[provider], status: 'searching' };
        }
        return next;
      });

      try {
        const res = await searchPositionDatabases(trimmed);
        if (fen !== currentFenRef.current) return;

        setResults((prev) => {
          const next = { ...prev };
          for (const provider of targets) {
            const found = res[provider].found;
            next[provider] = {
              status: found ? 'found' : 'notfound',
              url: res[provider].url
            };
          }
          return next;
        });
      } catch {
        if (fen !== currentFenRef.current) return;

        setResults((prev) => {
          const next = { ...prev };
          for (const provider of targets) {
            next[provider] = { ...next[provider], status: 'error' };
          }
          return next;
        });
      }
    },
    [fen]
  );

  const lichess = useProviderState('lichess', results.lichess, run);
  const chessdb = useProviderState('chessdb', results.chessdb, run);
  const searchAll = useCallback(() => run(PROVIDERS), [run]);

  return useMemo(
    () => ({ lichess, chessdb, searchAll }),
    [lichess, chessdb, searchAll]
  );
}

function useProviderState(
  provider: DatabaseProvider,
  { status, url }: ProviderData,
  run: (targets: readonly DatabaseProvider[]) => Promise<void>
): ProviderState {
  return useMemo(
    () => ({
      status,
      url,
      label: PROVIDER_LABEL[provider],
      search: () => void run([provider])
    }),
    [provider, status, url, run]
  );
}
