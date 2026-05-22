import { memo, useCallback } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useDrop } from 'react-dnd';

import DraggablePiece from '../DraggablePiece/DraggablePiece';
import { ItemTypes } from '@constants';
import type { PieceSymbol } from '@app-types/chess';

export interface DragItem {
  piece: PieceSymbol;
  pieceKey?: string;
  fromRow: number;
  fromCol: number;
  isFromPalette: boolean;
}

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
    isLoading
  }: DroppableSquareProps) {
    const bgColor = isLight ? lightColor : darkColor;

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
          if (node) drop(node);
        }}
        className="w-full h-full flex items-center justify-center relative"
        style={{
          backgroundColor: bgColor,
          zIndex: 0,
          boxShadow: isOver
            ? 'inset 0 0 0 3px rgba(255, 255, 255, 0.5)'
            : 'none',
          contain: 'layout style',
          minWidth: 0,
          minHeight: 0
        }}
        data-row={row}
        data-col={col}
      >
        <AnimatePresence mode="wait" initial={false}>
          {piece && pieceImage && !isLoading && (
            <motion.div
              key={piece + row + col}
              className="w-full h-full flex items-center justify-center"
              style={{ contain: 'layout style' }}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.72 }}
              transition={{ duration: 0.13, ease: [0.4, 0, 0.2, 1] }}
            >
              <DraggablePiece
                piece={piece}
                pieceImage={pieceImage}
                row={row}
                col={col}
                isFromPalette={false}
                size="85%"
              />
            </motion.div>
          )}
        </AnimatePresence>
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
      prevProps.pieceImage === nextProps.pieceImage
    );
  }
);

DroppableSquare.displayName = 'DroppableSquare';
export default DroppableSquare;
