import { useEffect, useRef, useState } from 'react';
import {
  type DatabaseProvider,
  PROVIDER_LABEL,
  searchPositionDatabases,
  validateFEN
} from '@utils';

// Types
type ProviderSearchStatus =
  | 'idle'
  | 'searching'
  | 'found'
  | 'notfound'
  | 'error';

export interface ProviderState {
  status: ProviderSearchStatus;
  label: string;
  url: string | null;
  search: () => void;
}

export interface UseDatabaseSearchResult {
  lichess: ProviderState;
  chessdb: ProviderState;
  pdb: ProviderState;
  yacpdb: ProviderState;
  searchAll: () => void;
}

// Constants
const PROVIDERS: DatabaseProvider[] = ['lichess', 'chessdb', 'pdb', 'yacpdb'];

interface ProviderData {
  status: ProviderSearchStatus;
  url: string | null;
}

const IDLE_STATE: Record<DatabaseProvider, ProviderData> = {
  lichess: { status: 'idle', url: null },
  chessdb: { status: 'idle', url: null },
  pdb: { status: 'idle', url: null },
  yacpdb: { status: 'idle', url: null }
};

export function useDatabaseSearch(fen: string): UseDatabaseSearchResult {
  const [results, setResults] = useState(IDLE_STATE);
  const currentFenRef = useRef(fen);

  useEffect(() => {
    currentFenRef.current = fen;
    setResults(IDLE_STATE);
  }, [fen]);

  async function run(targets: DatabaseProvider[]) {
    const trimmed = fen.trim();
    if (!trimmed || !validateFEN(trimmed)) return;

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
  }

  function makeProviderState(provider: DatabaseProvider): ProviderState {
    return {
      status: results[provider].status,
      url: results[provider].url,
      label: PROVIDER_LABEL[provider],
      search: () => run([provider])
    };
  }

  return {
    lichess: makeProviderState('lichess'),
    chessdb: makeProviderState('chessdb'),
    pdb: makeProviderState('pdb'),
    yacpdb: makeProviderState('yacpdb'),
    searchAll: () => run(PROVIDERS)
  };
}
