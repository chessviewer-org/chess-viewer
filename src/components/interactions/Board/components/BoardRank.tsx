import { memo } from 'react';

import type { BoardCell } from '@app-types';
import { getPieceKey } from '@/shared/utils/pieceUtils';
import { DroppableSquare } from './DroppableSquare';
import styles from '../styles/board.module.scss';

const BOARD_INDICES = [0, 1, 2, 3, 4, 5, 6, 7] as const;

interface BoardRankProps {
  rank: readonly BoardCell[];
  row: number;
  flipped: boolean;
  hatched: boolean;
  pieceImages: Record<string, HTMLImageElement | null>;
  selectedCol: number | undefined;
  cursorCol: number | undefined;
  heldCol: number | undefined;
  destinations: ReadonlyMap<number, boolean> | undefined;
  onSelect: (row: number, col: number) => void;
}

/** A move or cursor change only reconciles the affected ranks. */
export const BoardRank = memo(function BoardRank({
  rank,
  row,
  flipped,
  hatched,
  pieceImages,
  selectedCol,
  cursorCol,
  heldCol,
  destinations,
  onSelect
}: BoardRankProps) {
  return (
    <div role="row" className={styles.rank}>
      {BOARD_INDICES.map((displayCol) => {
        const col = flipped ? 7 - displayCol : displayCol;
        const piece = rank[col] || '';
        const pieceKey = getPieceKey(piece);
        const isLight = (row + col) % 2 === 0;
        return (
          <DroppableSquare
            key={col}
            row={row}
            col={col}
            piece={piece}
            halo={hatched && !isLight}
            pieceImage={pieceKey ? pieceImages[pieceKey] || null : null}
            onSelect={onSelect}
            isSelected={selectedCol === col}
            isCursor={cursorCol === col}
            isHeldSource={heldCol === col}
            destination={
              destinations?.has(col)
                ? destinations.get(col)
                  ? 'capture'
                  : 'move'
                : undefined
            }
          />
        );
      })}
    </div>
  );
});

BoardRank.displayName = 'BoardRank';
