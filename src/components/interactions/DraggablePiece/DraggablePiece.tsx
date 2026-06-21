import { memo, useMemo } from 'react';

import { useDraggable } from '@dnd-kit/core';

import type { ChessDragData } from '@constants';
import { getPieceImageKey } from '@constants';
import type { PieceSymbol } from '@app-types/chess';

/** Props for the `DraggablePiece` drag source. */
interface DraggablePieceProps {
  piece: PieceSymbol | '';
  pieceImage: HTMLImageElement | null;
  row?: number;
  col?: number;
  isFromPalette?: boolean;
  size?: string;
  disabled?: boolean;
}

/**
 * A single draggable chess piece rendered as an `<img>` wrapped in an
 * @dnd-kit drag source.
 *
 * When dragging, the original element becomes invisible (opacity 0 /
 * visibility hidden) and `ChessEditor`'s `<DragOverlay>` renders the ghost
 * following the pointer. This avoids the browser's native drag preview and
 * the react-dnd CustomDragLayer overhead.
 *
 * Drag IDs:
 *   Board piece:   `board-{row}-{col}`
 *   Palette piece: `palette-{piece}`
 *
 * The `data` payload (typed as `ChessDragData`) is read by
 * `ChessEditor.handleDragEnd` to decide what move to commit.
 */
const DraggablePiece = memo(function DraggablePiece({
  piece,
  pieceImage,
  row,
  col,
  isFromPalette = false,
  size = '85%',
  disabled = false
}: DraggablePieceProps) {
  const pieceKey = piece ? getPieceImageKey(piece as PieceSymbol) : null;

  // Build a stable, unique drag ID. Palette pieces share the same position
  // (no row/col) so they use the piece char; board pieces use grid coords.
  const id: string = isFromPalette
    ? `palette-${piece}`
    : `board-${row ?? 0}-${col ?? 0}`;

  const dragData = useMemo<ChessDragData>(
    () => ({
      piece: piece as PieceSymbol,
      pieceKey,
      fromRow: row,
      fromCol: col,
      isFromPalette
    }),
    [piece, pieceKey, row, col, isFromPalette]
  );

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: disabled || !piece,
    data: dragData
  });

  if (!piece || !pieceImage) return null;

  return (
    <div
      ref={setNodeRef}
      // @dnd-kit spreads pointer/touch/keyboard event handlers via listeners
      // and ARIA attributes (role, tabIndex, aria-roledescription) via attributes.
      {...listeners}
      {...attributes}
      className={`
        flex items-center justify-center
        select-none
        ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={{
        width: size,
        height: size,
        // Hide the origin piece while dragging — DragOverlay shows the ghost.
        opacity: isDragging ? 0 : disabled ? 0.5 : 1,
        visibility: isDragging ? 'hidden' : 'visible',
        transition: isDragging
          ? 'none'
          : 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        contain: 'layout style',
        // `touch-action: none` is required for @dnd-kit's TouchSensor to
        // capture touch events before the browser claims them for scrolling.
        // Set inline (not a global class) so only pieces suppress native scroll
        // — the rest of the page still scrolls normally via untouched elements.
        touchAction: disabled ? 'auto' : 'none'
      }}
      // Decorative for assistive tech: the wrapping control (palette button or
      // board gridcell) names the piece. This inner drag handle is silent to
      // avoid double announcement and is not a separate tab stop.
      aria-hidden="true"
    >
      <img
        src={pieceImage.src}
        alt=""
        className="w-full h-full object-contain"
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          // SVG pieces are vector data — browser rasterises them at device-pixel
          // size. No GPU layer / translateZ: that would bake the SVG into a texture
          // at the fractional CSS box, resampling and softening the image.
          imageRendering: 'auto'
        }}
        draggable={false}
      />
    </div>
  );
});

DraggablePiece.displayName = 'DraggablePiece';
export default DraggablePiece;
