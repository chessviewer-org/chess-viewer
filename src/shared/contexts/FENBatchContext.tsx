import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { ADVANCED_FEN_CONFIG } from '@constants';

import { safeJSONParse } from '@utils';
import { FENBatchContext, FENBatchContextValue } from './FENBatchStore';

/**
 * Provides FEN batch list state to the component subtree.
 *
 * Persists the batch list to `localStorage` on every change.
 */
export function FENBatchProvider({ children }: { children: React.ReactNode }) {
  const [batchList, setBatchList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fenBatchList');
      const parsed = safeJSONParse(saved, null);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('fenBatchList', JSON.stringify(batchList));
  }, [batchList]);

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
