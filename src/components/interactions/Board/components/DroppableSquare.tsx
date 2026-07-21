import { memo, useCallback } from 'react';

import type { PieceSymbol } from '@app-types';
import { indicesToSquare, pieceToName } from '@utils';
import { useDroppable } from '@hooks';
import { DraggablePiece } from './DraggablePiece';
import { shouldAnimateEntrance } from './entranceAnimation';

interface DroppableSquareProps {
  row: number;
  col: number;
  piece: PieceSymbol | '';
  isLight: boolean;
  lightColor: string;
  darkColor: string;
  pieceImage: HTMLImageElement | null;
  onSelect?: ((row: number, col: number) => void) | undefined;
  isSelected?: boolean;
  isCursor?: boolean;
  isHeldSource?: boolean;
  isLoading: boolean;
  cellSize?: number;
}

export const DroppableSquare = memo(
  function DroppableSquare({
    row,
    col,
    piece,
    isLight,
    lightColor,
    darkColor,
    pieceImage,
    onSelect,
    isSelected = false,
    isCursor = false,
    isHeldSource = false,
    isLoading,
    cellSize = 64
  }: DroppableSquareProps) {
    const bgColor = isLight ? lightColor : darkColor;
    const animateEntrance = !isLoading && shouldAnimateEntrance();
    const entranceDelay = animateEntrance ? `${(row * 8 + col) * 6}ms` : '0ms';

    const squareName = indicesToSquare(row, col);
    const ariaLabel = piece
      ? `${pieceToName(piece)}, ${squareName}`
      : `${squareName}, empty`;

    const handleSelect = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(row, col);
      },
      [onSelect, row, col]
    );

    const { setNodeRef, isOver } = useDroppable({
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
        className="w-full h-full flex items-center justify-center relative cursor-pointer"
        style={{
          backgroundColor: bgColor,
          outline: 'none',
          boxShadow: isOver ? 'inset 0 0 0 1px rgba(255,255,255,0.8)' : 'none',
          zIndex: isOver ? 2 : 0,
          minWidth: 0,
          minHeight: 0
        }}
        data-row={row}
        data-col={col}
      >
        {piece && pieceImage && !isLoading && (
          <div
            key={piece}
            className={`w-full h-full flex items-center justify-center${
              animateEntrance ? ' animate-piece-in' : ''
            }`}
            style={{
              contain: 'layout style',
              opacity: isHeldSource ? 0.45 : 1,
              animationDelay: entranceDelay
            }}
          >
            <DraggablePiece
              piece={piece}
              pieceImage={pieceImage}
              row={row}
              col={col}
              isFromPalette={false}
              size="100%"
              cellSize={cellSize}
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
      prevProps.lightColor === nextProps.lightColor &&
      prevProps.darkColor === nextProps.darkColor &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.row === nextProps.row &&
      prevProps.col === nextProps.col &&
      prevProps.onSelect === nextProps.onSelect &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isCursor === nextProps.isCursor &&
      prevProps.isHeldSource === nextProps.isHeldSource &&
      prevProps.pieceImage === nextProps.pieceImage &&
      prevProps.cellSize === nextProps.cellSize
    );
  }
);

DroppableSquare.displayName = 'DroppableSquare';
