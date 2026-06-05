import { useEffect, useState } from 'react';

import { syncStorage } from '@/features/auth/services/syncStorage';
import type { ActiveHistoryEntry } from '@app-types/history';

import { mergeById, sortByMostRecent } from '@utils/historyUtils';
import { safeJSONParse } from '@utils/validation';
import { persistHistory } from './persistHistory';

/**
 * Hydrates the FEN history from Supabase (preferred) or `localStorage` on mount,
 * and schedules debounced persistence on every subsequent history change.
 *
 * @param fenHistory - Current history list (used to trigger persistence)
 * @param setFenHistory - Setter to populate history after hydration
 * @param isMountedRef - Guard ref to prevent state updates after unmount
 * @returns `isHydrated` flag — `true` once the initial load has completed
 */
export function useHistoryHydration(
  fenHistory: ActiveHistoryEntry[],
  setFenHistory: React.Dispatch<React.SetStateAction<ActiveHistoryEntry[]>>,
  isMountedRef: React.MutableRefObject<boolean>
) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    const loadHistoryData = async () => {
      try {
        let cloudData: ActiveHistoryEntry[] | null = null;
        try {
          const cloud = await syncStorage.get('fen-history');
          if (cloud?.value)
            cloudData = safeJSONParse<ActiveHistoryEntry[]>(cloud.value, []);
        } catch {
          // Cloud unavailable — silently fall through to local storage
        }

        const local = window.localStorage.getItem('fen-history');
        const localData = local
          ? safeJSONParse<ActiveHistoryEntry[]>(local, [])
          : [];

        // The cloud copy may be trimmed to the server cap while localStorage
        // holds the full list, so union both rather than letting cloud shadow
        // the device-local older entries. Cloud wins id collisions (it can carry
        // newer cross-device edits).
        const data = sortByMostRecent(mergeById(cloudData ?? [], localData));

        if (isMountedRef.current) {
          setFenHistory(data);
        }
      } finally {
        if (isMountedRef.current) setIsHydrated(true);
      }
    };
    loadHistoryData();
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window && window.requestIdleCallback) {
        window.requestIdleCallback(() => persistHistory(fenHistory));
      } else {
        persistHistory(fenHistory);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fenHistory, isHydrated]);

  return { isHydrated };
}
