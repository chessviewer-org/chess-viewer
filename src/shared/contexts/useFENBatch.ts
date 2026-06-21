import { useContext } from 'react';

import { FENBatchContext, FENBatchContextValue } from './FENBatchStore';

/**
 * Returns FEN batch list state and actions from `FENBatchContext`.
 *
 * @throws If used outside of `<FENBatchProvider>`
 */
export function useFENBatch(): FENBatchContextValue {
  const context = useContext(FENBatchContext);
  if (!context) {
    throw new Error('useFENBatch must be used within FENBatchProvider');
  }
  return context;
}
