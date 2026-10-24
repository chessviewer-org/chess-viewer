/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { ADVANCED_FEN_CONFIG } from '@constants';

import { safeJSONParse } from '@chessviewer-org/chess-viewer';

// Types
export interface FENBatchContextValue {
  batchList: string[];
  addToBatch: (fen: string) => 'added' | 'duplicate' | 'limit' | 'invalid';
  removeFromBatch: (index: number) => void;
  clearBatch: () => void;
  updateBatchItem: (index: number, newFen: string) => boolean;
}

const BATCH_STORAGE_KEY = 'fenBatchList';

// Context
const FENBatchContext = createContext<FENBatchContextValue | null>(null);

function readBatchList(): string[] {
  try {
    const parsed = safeJSONParse<unknown>(
      localStorage.getItem(BATCH_STORAGE_KEY),
      null
    );
    return Array.isArray(parsed)
      ? parsed.filter((fen): fen is string => typeof fen === 'string')
      : [];
  } catch {
    return [];
  }
}

export function FENBatchProvider({ children }: { children: React.ReactNode }) {
  // State
  const [batchList, setBatchList] = useState<string[]>(readBatchList);
  const storedList = useRef(batchList);

  useEffect(() => {
    if (storedList.current === batchList) return;
    storedList.current = batchList;
    try {
      if (batchList.length)
        localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batchList));
      else localStorage.removeItem(BATCH_STORAGE_KEY);
    } catch {
      /* noop */
    }
  }, [batchList]);

  // Actions
  const addToBatch = useCallback(
    (fen: string): 'added' | 'duplicate' | 'limit' | 'invalid' => {
      if (typeof fen !== 'string') return 'invalid';
      const trimmed = fen.trim();
      if (!trimmed) return 'invalid';

      let result: 'added' | 'duplicate' | 'limit' | 'invalid' = 'invalid';
      setBatchList((prev) => {
        if (prev.some((f) => f.trim() === trimmed)) {
          result = 'duplicate';
          return prev;
        }
        if (prev.length >= ADVANCED_FEN_CONFIG.MAX_FENS) {
          result = 'limit';
          return prev;
        }
        result = 'added';
        return [...prev, fen];
      });
      return result;
    },
    []
  );

  const removeFromBatch = useCallback((index: number) => {
    setBatchList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearBatch = useCallback(() => {
    setBatchList([]);
  }, []);

  const updateBatchItem = useCallback((index: number, newFen: string) => {
    if (typeof newFen !== 'string') return false;
    setBatchList((prev) => {
      const updated = [...prev];
      updated[index] = newFen;
      return updated;
    });
    return true;
  }, []);

  const value = useMemo<FENBatchContextValue>(
    () => ({
      batchList,
      addToBatch,
      removeFromBatch,
      clearBatch,
      updateBatchItem
    }),
    [batchList, addToBatch, removeFromBatch, clearBatch, updateBatchItem]
  );

  return (
    <FENBatchContext.Provider value={value}>
      {children}
    </FENBatchContext.Provider>
  );
}

export function useFENBatch(): FENBatchContextValue {
  const context = useContext(FENBatchContext);
  if (!context) {
    throw new Error('useFENBatch must be used within FENBatchProvider');
  }
  return context;
}
