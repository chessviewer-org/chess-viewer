import { memo, useCallback } from 'react';

import type { BoardCell } from '@app-types';
import { cellName } from '@/shared/utils/boardCells';
import { indicesToSquare } from '@chessviewer-org/chess-viewer';
import { useDroppable } from '@/shared/hooks/useDragDrop';
import { DraggablePiece } from './DraggablePiece';

interface DroppableSquareProps {
  row: number;
  col: number;
  piece: BoardCell;
  isLight: boolean;
  backgroundColor: string;
  pieceImage: HTMLImageElement | null;
  onSelect?: ((row: number, col: number) => void) | undefined;
  isSelected?: boolean;
  isCursor?: boolean;
  isHeldSource?: boolean;
}

export const DroppableSquare = memo(
  function DroppableSquare({
    row,
    col,
    piece,
    isLight,
    backgroundColor,
    pieceImage,
    onSelect,
    isSelected = false,
    isCursor = false,
    isHeldSource = false
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
        className="w-full h-full flex items-center justify-center relative cursor-pointer data-drag-over:z-2 data-drag-over:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.85)]"
        style={{
          backgroundColor,
          outline: 'none',
          minWidth: 0,
          minHeight: 0
        }}
        data-row={row}
        data-col={col}
        data-shade={isLight ? 'light' : 'dark'}
      >
        {(isSelected || isCursor) && (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 z-10 border-2 ${isSelected ? 'border-text-primary' : 'border-accent'}`}
          />
        )}
        {piece && pieceImage && (
          <div
            key={piece}
            className="w-full h-full flex items-center justify-center"
            style={{
              contain: 'layout style',
              opacity: isHeldSource ? 0.45 : 1
            }}
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
      prevProps.isLight === nextProps.isLight &&
      prevProps.backgroundColor === nextProps.backgroundColor &&
      prevProps.row === nextProps.row &&
      prevProps.col === nextProps.col &&
      prevProps.onSelect === nextProps.onSelect &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isCursor === nextProps.isCursor &&
      prevProps.isHeldSource === nextProps.isHeldSource &&
      prevProps.pieceImage === nextProps.pieceImage
    );
  }
);

DroppableSquare.displayName = 'DroppableSquare';
