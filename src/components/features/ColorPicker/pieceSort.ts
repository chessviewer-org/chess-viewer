import { PIECE_SET_POPULARITY, PIECE_SETS } from '@constants';
import type { PieceSet } from '@app-types';

/** Piece-set ordering options surfaced beside the Piece set heading. */
export type PieceSort = 'popular' | 'name';

/** Popularity rank lookup: lower = more popular; unlisted ids sort last. */
const POPULARITY_RANK = new Map(
  PIECE_SET_POPULARITY.map((id, index) => [id, index])
);

/** Returns a new PIECE_SETS array ordered by the chosen sort. */
export function sortPieceSets(sort: PieceSort): PieceSet[] {
  const copy = [...PIECE_SETS];
  if (sort === 'name') {
    return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
  return copy.sort((a, b) => {
    const ra = POPULARITY_RANK.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const rb = POPULARITY_RANK.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}
