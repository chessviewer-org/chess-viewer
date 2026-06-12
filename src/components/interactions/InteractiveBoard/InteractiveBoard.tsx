import { memo, useCallback, useMemo, useRef } from 'react';

import { useDrop } from 'react-dnd';

import { ItemTypes } from '@constants';
import type { PieceSymbol } from '@app-types/chess';

import { describeBoardPosition } from '@utils';
import DroppableSquare from '../DroppableSquare/DroppableSquare';

/** Props for the `InteractiveBoard` DnD board grid. */
export interface InteractiveBoardProps {
  board: (PieceSymbol | '')[][];
  lightSquare: string;
  darkSquare: string;
  pieceImages: Record<string, HTMLImageElement | null>;
  isLoading: boolean;
  flipped: boolean;
  onPieceDrop?: (
    piece: PieceSymbol,
    fromRow: number | undefined,
    fromCol: number | undefined,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
  /** Click-to-select a square (enables keyboard delete). */
  onSquareSelect?: ((row: number, col: number) => void) | undefined;
  /** Currently selected square as `[row, col]`, or null when none. */
  selectedSquare?: readonly [number, number] | null | undefined;
}

export const InteractiveBoard = memo(function InteractiveBoard({
  board,
  lightSquare,
  darkSquare,
  pieceImages,
  isLoading,
  flipped,
  onPieceDrop,
  onSquareSelect,
  selectedSquare
}: InteractiveBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const handleDrop = useCallback(
    (
      piece: PieceSymbol,
      fromRow: number | undefined,
      fromCol: number | undefined,
      toRow: number,
      toCol: number,
      isFromPalette: boolean
    ) => {
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
            ] || null
          : null;
        const isSelected =
          selectedSquare?.[0] === actualRow &&
          selectedSquare?.[1] === actualCol;
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
            onSelect={onSquareSelect}
            isSelected={isSelected}
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
    pieceImages,
    onSquareSelect,
    selectedSquare
  ]);
  const boardDescription = useMemo(
    () => describeBoardPosition(board, flipped),
    [board, flipped]
  );
  return (
    <div
      className="w-full max-w-full"
      style={{ aspectRatio: '1 / 1', contain: 'layout' }}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {boardDescription}
      </div>
      <div
        ref={setRefs}
        role="grid"
        aria-label="Chess board, edit mode"
        className="grid grid-cols-8 grid-rows-8 overflow-hidden w-full h-full"
        style={{
          gap: 0,
          zIndex: 1,
          contain: 'layout style paint',
          fontSize: 0,
          lineHeight: 0,
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
