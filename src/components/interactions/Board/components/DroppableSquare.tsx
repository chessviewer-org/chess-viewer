import { memo, useCallback, useRef } from 'react';

import type { PieceSymbol } from '@app-types';
import { indicesToSquare, pieceToName } from '@utils';
import { useDroppable } from '@hooks';
import { DraggablePiece } from './DraggablePiece';

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
  isPlaceTarget?: boolean;
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
    isPlaceTarget = false,
    isLoading,
    cellSize = 64
  }: DroppableSquareProps) {
    const bgColor = isLight ? lightColor : darkColor;
    const wasLoadingRef = useRef(isLoading);
    const initialDelay =
      wasLoadingRef.current && !isLoading ? `${(row * 8 + col) * 6}ms` : '0ms';
    if (wasLoadingRef.current && !isLoading) wasLoadingRef.current = false;

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

    const ringShadow = isOver
      ? 'inset 0 0 0 3px rgba(255, 255, 255, 0.5)'
      : isCursor
        ? 'inset 0 0 0 3px var(--color-accent), inset 0 0 0 5px rgba(0,0,0,0.35)'
        : isSelected
          ? 'inset 0 0 0 2px var(--color-text-primary)'
          : isHeldSource
            ? 'inset 0 0 0 3px var(--color-accent)'
            : null;

    return (
      <div
        ref={setNodeRef}
        id={`sq-${row}-${col}`}
        onClick={handleSelect}
        role="gridcell"
        aria-label={ariaLabel}
        aria-selected={isSelected || isCursor}
        className={`w-full h-full flex items-center justify-center relative cursor-pointer ${
          isPlaceTarget ? 'group' : ''
        }`}
        style={{
          backgroundColor: bgColor,
          zIndex: ringShadow ? 2 : 0,
          contain: 'layout style',
          minWidth: 0,
          minHeight: 0,
          outline: `0.5px solid ${bgColor}`
        }}
        data-row={row}
        data-col={col}
      >
        {piece && pieceImage && !isLoading && (
          <div
            key={piece}
            className="w-full h-full flex items-center justify-center animate-piece-in"
            style={{
              contain: 'layout style',
              opacity: isHeldSource ? 0.45 : 1,
              animationDelay: initialDelay
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
        {ringShadow && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              boxShadow: ringShadow,
              pointerEvents: 'none',
              zIndex: 3
            }}
          />
        )}
        {isPlaceTarget && !ringShadow && (
          <div
            aria-hidden="true"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid var(--color-text-primary)',
              boxSizing: 'border-box',
              pointerEvents: 'none',
              zIndex: 3
            }}
          />
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
      prevProps.isPlaceTarget === nextProps.isPlaceTarget &&
      prevProps.pieceImage === nextProps.pieceImage &&
      prevProps.cellSize === nextProps.cellSize
    );
  }
);

DroppableSquare.displayName = 'DroppableSquare';
