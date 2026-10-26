import { memo, useCallback } from 'react';

import type { BoardCell } from '@app-types';
import { cellName } from '@/shared/utils/boardCells';
import { indicesToSquare } from '@chessviewer-org/chess-viewer';
import { useDroppable } from '@/shared/hooks/useDragDrop';
import { DraggablePiece } from './DraggablePiece';
import styles from '../styles/board.module.scss';

interface DroppableSquareProps {
  row: number;
  col: number;
  piece: BoardCell;
  halo: boolean;
  pieceImage: HTMLImageElement | null;
  onSelect?: ((row: number, col: number) => void) | undefined;
  isSelected?: boolean;
  isCursor?: boolean;
  isHeldSource?: boolean;
  destination?: 'move' | 'capture' | undefined;
}

export const DroppableSquare = memo(
  function DroppableSquare({
    row,
    col,
    piece,
    halo,
    pieceImage,
    onSelect,
    isSelected = false,
    isCursor = false,
    isHeldSource = false,
    destination
  }: DroppableSquareProps) {
    const squareName = indicesToSquare(row, col);
    const ariaLabel = piece
      ? `${cellName(piece)}, ${squareName}`
      : `${squareName}, empty`;

    const handleSelect = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(row, col);
      },
      [onSelect, row, col]
    );

    const setNodeRef = useDroppable({
      id: `sq-${row}-${col}`,
      data: { row, col }
    });

    return (
      <div
        ref={setNodeRef}
        id={`sq-${row}-${col}`}
        onClick={handleSelect}
        role="gridcell"
        aria-label={ariaLabel}
        aria-selected={isSelected || isCursor}
        className={halo ? `${styles.square} ${styles.halo}` : styles.square}
        data-row={row}
        data-col={col}
      >
        {(isSelected || isCursor) && (
          <span
            aria-hidden="true"
            className={`${styles.mark} ${isSelected ? styles.selected : styles.cursor}`}
          />
        )}
        {destination && (
          <span
            aria-hidden="true"
            className={`${styles.mark} ${destination === 'capture' ? styles.capture : styles.destination}`}
          />
        )}
        {piece && pieceImage && (
          <div
            key={piece}
            className={styles.pieceSlot}
            style={{ opacity: isHeldSource ? 0.45 : 1 }}
          >
            <DraggablePiece
              piece={piece}
              pieceImage={pieceImage}
              row={row}
              col={col}
              isFromPalette={false}
              size="100%"
            />
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.piece === nextProps.piece &&
      prevProps.halo === nextProps.halo &&
      prevProps.row === nextProps.row &&
      prevProps.col === nextProps.col &&
      prevProps.onSelect === nextProps.onSelect &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isCursor === nextProps.isCursor &&
      prevProps.isHeldSource === nextProps.isHeldSource &&
      prevProps.destination === nextProps.destination &&
      prevProps.pieceImage === nextProps.pieceImage
    );
  }
);

DroppableSquare.displayName = 'DroppableSquare';
