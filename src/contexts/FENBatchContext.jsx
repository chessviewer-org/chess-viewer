import { useCallback, useEffect, useMemo, useState } from 'react';

import { validateFEN } from '@/utils';
import { getStoredValue } from '@/utils/validation';
import { FENBatchContext } from './FENBatchStore';

/**
 * Provides FEN batch state to the component subtree.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function FENBatchProvider({ children }) {
  const [batchList, setBatchList] = useState(() => {
    try {
      const parsed = getStoredValue('fenBatchList', null);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('fenBatchList', JSON.stringify(batchList));
    } catch {
      // Storage unavailable (quota exceeded or private mode); keep in-memory state.
    }
  }, [batchList]);
  const addToBatch = useCallback((fen) => {
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
  const removeFromBatch = useCallback((index) => {
    setBatchList((prev) => prev.filter((_, i) => i !== index));
  }, []);
  const clearBatch = useCallback(() => {
    setBatchList([]);
  }, []);
  const updateBatchItem = useCallback((index, newFen) => {
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
  const value = useMemo(
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
