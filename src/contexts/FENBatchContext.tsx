import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { validateFEN } from '@utils';
import { safeJSONParse } from '@utils/validation';
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

  const addToBatch = useCallback((fen: string) => {
    if (!fen || !validateFEN(fen)) {
      return false;
    }
    const trimmedFen = fen.trim();
    let added = false;
    setBatchList((prev) => {
      if (prev.includes(trimmedFen)) return prev;
      added = true;
      return [...prev, trimmedFen];
    });
    return added;
  }, []);

  const removeFromBatch = useCallback((index: number) => {
    setBatchList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearBatch = useCallback(() => {
    setBatchList([]);
  }, []);

  const updateBatchItem = useCallback((index: number, newFen: string) => {
    if (!newFen || !validateFEN(newFen)) {
      return false;
    }
    setBatchList((prev) => {
      const updated = [...prev];
      updated[index] = newFen.trim();
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
