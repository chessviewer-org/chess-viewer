import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import type { PieceSymbol } from '@app-types/chess';

import { describeBoardPosition } from '@utils';
import DroppableSquare from '../DroppableSquare/DroppableSquare';
import { useBoardKeyboard } from './useBoardKeyboard';

/** Imperative keyboard handle the board exposes to its host (palette wiring). */
export interface BoardKeyboardApi {
  /** Carry a palette piece on the keyboard cursor and focus the grid. */
  pickUpFromPalette: (piece: PieceSymbol) => void;
}

/** Props for the `InteractiveBoard` DnD board grid. */
interface InteractiveBoardProps {
  board: (PieceSymbol | '')[][];
  lightSquare: string;
  darkSquare: string;
  pieceImages: Record<string, HTMLImageElement | null>;
  isLoading: boolean;
  flipped: boolean;
  /**
   * Called by the keyboard layer (`useBoardKeyboard`) when a piece is placed via
   * keyboard navigation. DnD drops are handled centrally in `ChessEditor`.
   */
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
  /** Remove the piece on a square (keyboard Delete/Backspace on the grid). */
  onPieceRemove?: ((row: number, col: number) => void) | undefined;
  /** Receives the board's imperative keyboard API once (palette → board). */
  onKeyboardApi?: ((api: BoardKeyboardApi) => void) | undefined;
}

const InteractiveBoard = memo(function InteractiveBoard({
  board,
  lightSquare,
  darkSquare,
  pieceImages,
  isLoading,
  flipped,
  onPieceDrop,
  onSquareSelect,
  selectedSquare,
  onPieceRemove,
  onKeyboardApi
}: InteractiveBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const {
    cursor,
    isFocused,
    heldFrom,
    activeDescendantId,
    announcement,
    onKeyDown,
    onFocus,
    onBlur,
    onPointerDown,
    pickUpFromPalette
  } = useBoardKeyboard({
    board,
    flipped,
    ...(onPieceDrop ? { onPieceDrop } : {}),
    ...(onPieceRemove ? { onPieceRemove } : {})
  });

  // Publish the imperative API to the host so the palette can hand a freshly
  // chosen piece to the keyboard cursor and we can focus the grid for placement.
  useEffect(() => {
    if (!onKeyboardApi) return;
    onKeyboardApi({
      pickUpFromPalette: (piece: PieceSymbol) => {
        pickUpFromPalette(piece);
        boardRef.current?.focus();
      }
    });
  }, [onKeyboardApi, pickUpFromPalette]);

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
        // Only paint the cursor ring while the grid is focused.
        const isCursor =
          isFocused && cursor.row === actualRow && cursor.col === actualCol;
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
    isFocused,
    heldFrom
  ]);

  const boardDescription = useMemo(
    () => describeBoardPosition(board, flipped),
    [board, flipped]
  );

  // Stable callback ref — just stores the node in boardRef (no DnD connector
  // to merge; @dnd-kit's DroppableSquare children register themselves).
  const setRef = useCallback((node: HTMLDivElement | null) => {
    boardRef.current = node;
  }, []);

  return (
    <div
      className="w-full max-w-full"
      style={{ aspectRatio: '1 / 1', contain: 'layout' }}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {boardDescription}
      </div>
      {/* Action announcer — narrates cursor moves, pickups, placements, and
          removals so a keyboard/SR user can drive the board without sight. */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <div
        ref={setRef}
        role="grid"
        // Single tab stop with a roving cursor (aria-activedescendant) instead
        // of 64 tab stops — keyboard users land here once, then arrow around.
        tabIndex={0}
        aria-label="Chess board, edit mode. Use arrow keys to move, Enter or Space to pick up and place a piece, Delete to remove, Escape to cancel."
        aria-activedescendant={activeDescendantId}
        // Tell the app-wide page scroller to keep its hands off the arrow keys
        // while this grid owns focus (see usePageScrollKeys / ownsArrowKeys).
        data-arrow-keys="self"
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        onPointerDown={onPointerDown}
        className="grid grid-cols-8 grid-rows-8 overflow-hidden w-full h-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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
