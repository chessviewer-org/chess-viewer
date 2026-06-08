import { memo, useCallback } from 'react';

import { useDrop } from 'react-dnd';

import { ItemTypes } from '@constants';
import type { PieceSymbol } from '@app-types/chess';

import DraggablePiece from '../DraggablePiece/DraggablePiece';

/** The drag item payload passed between react-dnd sources and targets. */
export interface DragItem {
  piece: PieceSymbol;
  pieceKey?: string;
  fromRow: number;
  fromCol: number;
  isFromPalette: boolean;
}

/** Props for the `DroppableSquare` memo'd drop target cell. */
export interface DroppableSquareProps {
  row: number;
  col: number;
  piece: PieceSymbol | '';
  isLight: boolean;
  lightColor: string;
  darkColor: string;
  pieceImage: HTMLImageElement | null;
  onDrop?: (
    piece: PieceSymbol,
    fromRow: number | undefined,
    fromCol: number | undefined,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
  /** Select this square (click). Enables keyboard delete of its piece. */
  onSelect?: ((row: number, col: number) => void) | undefined;
  /** Whether this square is the active selection (keyboard target). */
  isSelected?: boolean;
  isLoading: boolean;
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
    onDrop,
    onSelect,
    isSelected = false,
    isLoading
  }: DroppableSquareProps) {
    const bgColor = isLight ? lightColor : darkColor;

    const handleSelect = useCallback(() => {
      onSelect?.(row, col);
    }, [onSelect, row, col]);

    const handleDrop = useCallback(
      (item: DragItem) => {
        if (onDrop) {
          onDrop(
            item.piece,
            item.fromRow,
            item.fromCol,
            row,
            col,
            item.isFromPalette
          );
        }
      },
      [onDrop, row, col]
    );

    const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>(
      () => ({
        accept: ItemTypes.PIECE,
        drop: handleDrop,
        canDrop: () => true,
        collect: (monitor) => ({
          isOver: monitor.isOver({
            shallow: true
          })
        })
      }),
      [handleDrop]
    );

    return (
      <div
        ref={(node) => {
          drop(node);
          // Detach the react-dnd connector on unmount so the backend removes its
          // node-bound listeners; without this the cell (and its piece <img>)
          // stays detached-but-referenced via the listener, leaking every time
          // the board unmounts on route change. Connector returns a value; the
          // cleanup must return void, so we don't forward it.
          return () => {
            drop(null);
          };
        }}
        onClick={handleSelect}
        className="w-full h-full flex items-center justify-center relative cursor-pointer"
        style={{
          backgroundColor: bgColor,
          zIndex: isSelected ? 2 : 0,
          boxShadow: isOver
            ? 'inset 0 0 0 3px rgba(255, 255, 255, 0.5)'
            : isSelected
              ? 'inset 0 0 0 3px var(--accent)'
              : 'none',
          contain: 'layout style',
          minWidth: 0,
          minHeight: 0
        }}
        data-row={row}
        data-col={col}
      >
        {piece && pieceImage && !isLoading && (
          // `key` on the piece char remounts this wrapper when the piece on the
          // square changes, re-firing the `animate-piece-in` keyframe — the CSS
          // replacement for the former per-square framer-motion AnimatePresence.
          <div
            key={piece}
            className="w-full h-full flex items-center justify-center animate-piece-in"
            style={{ contain: 'layout style' }}
          >
            <DraggablePiece
              piece={piece}
              pieceImage={pieceImage}
              row={row}
              col={col}
              isFromPalette={false}
              size="85%"
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
      prevProps.onDrop === nextProps.onDrop &&
      prevProps.onSelect === nextProps.onSelect &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.pieceImage === nextProps.pieceImage
    );
  }
);

DroppableSquare.displayName = 'DroppableSquare';
export default DroppableSquare;
