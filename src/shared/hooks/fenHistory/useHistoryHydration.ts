import { useEffect, useState } from 'react';
import { syncStorage } from '@/features/auth/services/syncStorage';
import { safeJSONParse } from '@utils/validation';
import type { ActiveHistoryEntry } from '@app-types/history';

import { persistHistory } from './persistHistory';

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
        let data: ActiveHistoryEntry[] | null = null;
        try {
          const cloud = await syncStorage.get('fen-history');
          if (cloud?.value)
            data = safeJSONParse<ActiveHistoryEntry[]>(cloud.value, []);
        } catch {
          // Cloud failure is handled silently, fallback to local
        }

        if (!data) {
          const local = window.localStorage.getItem('fen-history');
          if (local) data = safeJSONParse<ActiveHistoryEntry[]>(local, []);
        }

        if (Array.isArray(data) && isMountedRef.current) {
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
