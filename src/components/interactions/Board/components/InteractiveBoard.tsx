import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import type { PieceSymbol } from '@app-types';

import { describeBoardPosition, getPieceKey } from '@utils';
import { DroppableSquare } from './DroppableSquare';
import { markEntrancePlayed } from './entranceAnimation';
import { useBoardKeyboard } from '../hooks/useBoardKeyboard';

// Types
export interface BoardKeyboardApi {
  pickUpFromPalette: (piece: PieceSymbol) => void;
  clearHeld: () => void;
}

interface InteractiveBoardProps {
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
  onSquareSelect?: ((row: number, col: number) => void) | undefined;
  selectedSquare?: readonly [number, number] | null | undefined;
  paletteActive?: boolean;
  onPieceRemove?: ((row: number, col: number) => void) | undefined;
  onKeyboardApi?: ((api: BoardKeyboardApi) => void) | undefined;
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
  selectedSquare,
  paletteActive = false,
  onPieceRemove,
  onKeyboardApi
}: InteractiveBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const {
    cursor,
    heldFrom,
    activeDescendantId,
    announcement,
    onKeyDown,
    onBlur,
    pickUpFromPalette,
    clearHeld
  } = useBoardKeyboard({
    board,
    flipped,
    ...(onPieceDrop ? { onPieceDrop } : {}),
    ...(onPieceRemove ? { onPieceRemove } : {})
  });

  useEffect(() => {
    if (!isLoading) markEntrancePlayed();
  }, [isLoading]);

  useEffect(() => {
    if (!onKeyboardApi) return;
    onKeyboardApi({
      pickUpFromPalette: (piece: PieceSymbol) => {
        pickUpFromPalette(piece);
        boardRef.current?.focus();
      },
      clearHeld
    });
  }, [onKeyboardApi, pickUpFromPalette, clearHeld]);

  const squares = useMemo(() => {
    const result = [];
    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        const actualRow = flipped ? 7 - displayRow : displayRow;
        const actualCol = flipped ? 7 - displayCol : displayCol;
        const isLight = (actualRow + actualCol) % 2 === 0;
        const piece = board[actualRow]?.[actualCol] || '';
        const pieceKey = getPieceKey(piece);
        const pieceImage = pieceKey ? pieceImages[pieceKey] || null : null;
        const isSelected =
          selectedSquare?.[0] === actualRow &&
          selectedSquare?.[1] === actualCol;
        const isCursor =
          cursor !== null &&
          cursor.row === actualRow &&
          cursor.col === actualCol;
        const isHeldSource =
          heldFrom?.row === actualRow && heldFrom?.col === actualCol;
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
            onSelect={onSquareSelect}
            isSelected={isSelected}
            isPlaceTarget={paletteActive}
            isCursor={isCursor}
            isHeldSource={isHeldSource}
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
    pieceImages,
    onSquareSelect,
    selectedSquare,
    cursor,
    heldFrom,
    paletteActive
  ]);

  const boardDescription = useMemo(
    () => describeBoardPosition(board, flipped),
    [board, flipped]
  );

  const setRef = useCallback((node: HTMLDivElement | null) => {
    boardRef.current = node;
  }, []);

  return (
    <div className="w-full h-full" style={{ contain: 'layout' }}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {boardDescription}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <div
        ref={setRef}
        role="grid"
        tabIndex={0}
        aria-label="Chess board, edit mode. Use arrow keys to move, Enter or Space to pick up and place a piece, Delete to remove, Escape to cancel."
        {...(activeDescendantId
          ? { 'aria-activedescendant': activeDescendantId }
          : {})}
        data-arrow-keys="self"
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className="grid grid-cols-8 grid-rows-8 overflow-hidden w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        style={{
          gap: 0,
          zIndex: 1,
          borderRadius: 0,
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
