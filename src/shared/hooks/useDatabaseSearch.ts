import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  type DatabaseProvider,
  type DatabaseSearchResult,
  PROVIDER_LABEL,
  searchPositionDatabases,
  validateFEN
} from '@utils';
import { logger } from '@utils';

/**
 * Per-provider search lifecycle. Search is now STRICTLY MANUAL — nothing fires
 * on FEN change; a provider stays `idle` until the user presses a Search button.
 * - `idle`      not searched for the current position
 * - `searching` a lookup is in flight
 * - `found`     the position is catalogued in this database (`url` opens it)
 * - `notfound`  the lookup completed with no match here
 * - `error`     the lookup failed unexpectedly
 */
type ProviderSearchStatus =
  | 'idle'
  | 'searching'
  | 'found'
  | 'notfound'
  | 'error';

/** UI-facing state for one database provider row. */
export interface ProviderState {
  status: ProviderSearchStatus;
  /** Display label, e.g. "PDB". */
  label: string;
  /** External result/search URL (present once a lookup has produced one). */
  url: string | null;
  /** Trigger a lookup for this single provider. */
  search: () => void;
}

export interface UseDatabaseSearchResult {
  lichess: ProviderState;
  chessdb: ProviderState;
  pdb: ProviderState;
  yacpdb: ProviderState;
  searchAll: () => void;
}

type StatusMap = Record<DatabaseProvider, ProviderSearchStatus>;
type UrlMap = Record<DatabaseProvider, string | null>;

const IDLE_STATUS: StatusMap = {
  lichess: 'idle',
  chessdb: 'idle',
  pdb: 'idle',
  yacpdb: 'idle'
};
const EMPTY_URLS: UrlMap = {
  lichess: null,
  chessdb: null,
  pdb: null,
  yacpdb: null
};

/**
 * Manual lookup of the current position in the chess problem databases
 * (PDB / YACPDB). Returns per-provider state, each with its own `search()`.
 *
 * The edge proxy resolves both providers in a single call, so a provider's
 * `search()` runs one combined lookup; the `which` argument only scopes which
 * rows show the `searching` spinner and pick up the result. Changing `fen`
 * resets all rows to `idle` (stale results are cleared) but never auto-searches.
 *
 * @param fen Current board FEN.
 */
export function useDatabaseSearch(fen: string): UseDatabaseSearchResult {
  const [statuses, setStatuses] = useState<StatusMap>(IDLE_STATUS);
  const [urls, setUrls] = useState<UrlMap>(EMPTY_URLS);

  // Abort any in-flight lookup when the position changes or on unmount.
  const controllerRef = useRef<AbortController | null>(null);

  // Reset to idle whenever the position changes — no auto-search.
  useEffect(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatuses(IDLE_STATUS);
    setUrls(EMPTY_URLS);
  }, [fen]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = useCallback(
    (which: DatabaseProvider[]) => {
      const trimmed = fen.trim();
      if (!trimmed || !validateFEN(trimmed)) return;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatuses((prev) => {
        const next = { ...prev };
        for (const p of which) next[p] = 'searching';
        return next;
      });

      searchPositionDatabases(trimmed, controller.signal)
        .then((res: DatabaseSearchResult) => {
          if (controller.signal.aborted) return;
          setStatuses((prev) => {
            const next = { ...prev };
            for (const p of which)
              next[p] = res[p].found ? 'found' : 'notfound';
            return next;
          });
          setUrls((prev) => {
            const next = { ...prev };
            for (const p of which) next[p] = res[p].url;
            return next;
          });
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          if (controller.signal.aborted) return;
          logger.warn('Database search failed', err);
          setStatuses((prev) => {
            const next = { ...prev };
            for (const p of which) next[p] = 'error';
            return next;
          });
        });
    },
    [fen]
  );

  const searchAll = useCallback(
    () => run(['lichess', 'chessdb', 'pdb', 'yacpdb']),
    [run]
  );

  const lichess = useMemo<ProviderState>(
    () => ({
      status: statuses.lichess,
      label: PROVIDER_LABEL.lichess,
      url: urls.lichess,
      search: () => run(['lichess'])
    }),
    [statuses.lichess, urls.lichess, run]
  );

  const chessdb = useMemo<ProviderState>(
    () => ({
      status: statuses.chessdb,
      label: PROVIDER_LABEL.chessdb,
      url: urls.chessdb,
      search: () => run(['chessdb'])
    }),
    [statuses.chessdb, urls.chessdb, run]
  );

  const pdb = useMemo<ProviderState>(
    () => ({
      status: statuses.pdb,
      label: PROVIDER_LABEL.pdb,
      url: urls.pdb,
      search: () => run(['pdb'])
    }),
    [statuses.pdb, urls.pdb, run]
  );

  const yacpdb = useMemo<ProviderState>(
    () => ({
      status: statuses.yacpdb,
      label: PROVIDER_LABEL.yacpdb,
      url: urls.yacpdb,
      search: () => run(['yacpdb'])
    }),
    [statuses.yacpdb, urls.yacpdb, run]
  );

  return { lichess, chessdb, pdb, yacpdb, searchAll };
}
