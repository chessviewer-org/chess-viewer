import { memo, useCallback } from 'react';

import { useDroppable } from '@dnd-kit/core';

import type { PieceSymbol } from '@app-types/chess';

import { pieceToName } from '@utils';
import DraggablePiece from '../DraggablePiece/DraggablePiece';

const FILES = 'abcdefgh';

/** Props for the `DroppableSquare` memo'd drop target cell. */
interface DroppableSquareProps {
  row: number;
  col: number;
  piece: PieceSymbol | '';
  isLight: boolean;
  lightColor: string;
  darkColor: string;
  pieceImage: HTMLImageElement | null;
  /** Select this square (click). Enables keyboard delete of its piece. */
  onSelect?: ((row: number, col: number) => void) | undefined;
  /** Whether this square is the active selection (keyboard target). */
  isSelected?: boolean;
  /** Whether the roving keyboard cursor is currently on this square. */
  isCursor?: boolean;
  /** Whether this square holds the piece that was picked up for keyboard move. */
  isHeldSource?: boolean;
  isLoading: boolean;
}

/**
 * A single board square that accepts drops via @dnd-kit's `useDroppable`.
 *
 * Drop ID: `sq-{row}-{col}`  — parsed by `ChessEditor.handleDragEnd`.
 * Drop data: `{ row, col }` — passed as `over.data.current` in `handleDragEnd`.
 *
 * All drop logic (piece placement, trash removal) is centralised in
 * `ChessEditor.handleDragEnd`; this component only signals hover state.
 */
const DroppableSquare = memo(
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
    isLoading
  }: DroppableSquareProps) {
    const bgColor = isLight ? lightColor : darkColor;

    const squareName = `${FILES[col] ?? col}${8 - row}`;
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
      // `data` carries grid coordinates so ChessEditor.handleDragEnd knows
      // which square was targeted without parsing the id string.
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
          zIndex: isCursor || isSelected || isHeldSource ? 2 : 0,
          // Ring precedence: pointer drag-over → keyboard cursor → keyboard
          // selection → held source → none.
          boxShadow: isOver
            ? 'inset 0 0 0 3px rgba(255, 255, 255, 0.5)'
            : isCursor
              ? 'inset 0 0 0 3px var(--color-accent), inset 0 0 0 5px rgba(0,0,0,0.35)'
              : isSelected
                ? 'inset 0 0 0 2px var(--color-text-primary)'
                : isHeldSource
                  ? 'inset 0 0 0 3px var(--color-accent)'
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
          // square changes, re-firing the `animate-piece-in` keyframe.
          <div
            key={piece}
            className="w-full h-full flex items-center justify-center animate-piece-in"
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
              // Fill the (integer-pixel) square edge-to-edge. The Lichess SVGs
              // carry their own internal margin so 100% looks right AND keeps
              // the image box pixel-aligned.
              size="100%"
            />
          </div>
        )}
      </div>
    );
  },
  // Manual comparator: re-render only when visible or interactive state changes.
  // `onDrop` is intentionally omitted — drops are handled by ChessEditor,
  // not by this component, so callback identity changes don't trigger repaints.
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
      prevProps.pieceImage === nextProps.pieceImage
    );
  }
);

DroppableSquare.displayName = 'DroppableSquare';
export default DroppableSquare;
