import { useContext } from 'react';

import { FENBatchContext, FENBatchContextValue } from './FENBatchStore';

/**
 * Returns FEN batch list state and actions from FENBatchContext.
 *
 * @returns {FENBatchContextValue} FEN batch context value
 */
export function useFENBatch(): FENBatchContextValue {
  const context = useContext(FENBatchContext);
  if (!context) {
    throw new Error('useFENBatch must be used within FENBatchProvider');
  }
  return context;
}
