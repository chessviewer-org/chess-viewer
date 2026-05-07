import { memo, useCallback, useMemo, useRef } from 'react';

import { useDrop } from 'react-dnd';

import { DroppableSquare } from '@/components/interactions';
import { ItemTypes } from '@/constants';

export interface InteractiveBoardProps {
  board: string[][];
  lightSquare: string;
  darkSquare: string;
  pieceImages: Record<string, HTMLImageElement | null>;
  isLoading: boolean;
  flipped: boolean;
  onPieceDrop?: (
    piece: string,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
}

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
export const InteractiveBoard = memo(function InteractiveBoard({
  board,
  lightSquare,
  darkSquare,
  pieceImages,
  isLoading,
  flipped,
  onPieceDrop
}: InteractiveBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const handleDrop = useCallback(
    (piece: string, fromRow: number, fromCol: number, toRow: number, toCol: number, isFromPalette: boolean) => {
      if (onPieceDrop) {
        onPieceDrop(piece, fromRow, fromCol, toRow, toCol, isFromPalette);
      }
    },
    [onPieceDrop]
  );
  const [, boardDropRef] = useDrop(
    () => ({
      accept: ItemTypes.PIECE
    }),
    []
  );
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      boardRef.current = node;
      boardDropRef(node);
    },
    [boardDropRef]
  );
  const squares = useMemo(() => {
    const result = [];
    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        const actualRow = flipped ? 7 - displayRow : displayRow;
        const actualCol = flipped ? 7 - displayCol : displayCol;
        const isLight = (actualRow + actualCol) % 2 === 0;
        const piece = board[actualRow]?.[actualCol] || '';
        const pieceImage = piece
          ? pieceImages[
              (piece === piece.toUpperCase() ? 'w' : 'b') + piece.toUpperCase()
            ]
          : null;
        result.push(
          <DroppableSquare
            key={`square-${actualRow}-${actualCol}`}
            row={actualRow}
            col={actualCol}
            piece={piece}
            isLight={isLight}
            lightColor={lightSquare}
            darkColor={darkSquare}
            pieceImage={pieceImage}
            onDrop={handleDrop}
            isLoading={isLoading}
          />
        );
      }
    }
    return result;
  }, [
    board,
    lightSquare,
    darkSquare,
    isLoading,
    flipped,
    handleDrop,
    pieceImages
  ]);
  return (
    <div
      className="w-full max-w-full"
      style={{ aspectRatio: '1 / 1', contain: 'layout' }}
    >
      <div
        ref={setRefs}
        className="grid grid-cols-8 grid-rows-8 gap-0 overflow-hidden w-full h-full"
        style={{
          zIndex: 1,
          contain: 'layout style paint',
          borderRadius: '0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}
      >
        {squares}
      </div>
    </div>
  );
});
InteractiveBoard.displayName = 'InteractiveBoard';
export default InteractiveBoard;
