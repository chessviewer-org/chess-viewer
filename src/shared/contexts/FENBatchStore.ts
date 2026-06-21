import { createContext } from 'react';

/** The value provided by `FENBatchContext`. */
export interface FENBatchContextValue {
  batchList: string[];
  addToBatch: (fen: string) => 'added' | 'duplicate' | 'limit' | 'invalid';
  removeFromBatch: (index: number) => void;
  clearBatch: () => void;
  updateBatchItem: (index: number, newFen: string) => boolean;
}

/**
 * Shared context object for FEN batch state.
 */
export const FENBatchContext = createContext<FENBatchContextValue | null>(null);
