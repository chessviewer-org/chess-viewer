import { useMemo } from 'react';

import { type PieceSort, sortPieceSets } from '@utils';
import { useLocalStorage } from './useLocalStorage';

/**
 * Shared piece-sort state: persists the user's chosen sort order and returns
 * a pre-sorted piece-set array. Used by Board settings, Export Studio, and the
 * Advanced FEN wizard — keeps the sort preference in sync across all surfaces.
 */
export function usePieceSort() {
  const [pieceSort, setPieceSort] = useLocalStorage<PieceSort>(
    'cv_piece_sort',
    'popular'
  );
  const sortedPieceSets = useMemo(() => sortPieceSets(pieceSort), [pieceSort]);
  return { pieceSort, setPieceSort, sortedPieceSets };
}
