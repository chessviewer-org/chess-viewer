import { memo, useEffect, useLayoutEffect, useRef } from 'react';

import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { getPieceImageKey, ItemTypes } from '@constants';
import type { PieceSymbol } from '@app-types/chess';

/** Props for the `DraggablePiece` memo'd drag source. */
export interface DraggablePieceProps {
  piece: PieceSymbol | '';
  pieceImage: HTMLImageElement | null;
  row?: number;
  col?: number;
  isFromPalette?: boolean;
  size?: string;
  disabled?: boolean;
}

/**
 * A single draggable chess piece rendered as an `<img>` wrapped in a react-dnd
 * drag source. Uses an empty drag preview so `CustomDragLayer` renders the
 * custom overlay instead of the browser's native ghost image.
 */
export const DraggablePiece = memo(function DraggablePiece({
  piece,
  pieceImage,
  row,
  col,
  isFromPalette = false,
  size = '85%',
  disabled = false
}: DraggablePieceProps) {
  const pieceRef = useRef<HTMLDivElement | null>(null);
  const pieceKey = getPieceImageKey(piece);
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.PIECE,
      item: () => ({
        piece,
        pieceKey,
        fromRow: row,
        fromCol: col,
        isFromPalette
      }),
      canDrag: () => !disabled && !!piece,
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    }),
    [piece, pieceKey, row, col, isFromPalette, disabled]
  );
  useEffect(() => {
    preview(getEmptyImage(), {
      captureDraggingState: true
    });
  }, [preview]);
  useLayoutEffect(() => {
    if (pieceRef.current) {
      if (isDragging) {
        pieceRef.current.style.willChange = 'opacity, transform';
      } else {
        pieceRef.current.style.willChange = 'auto';
      }
    }
  }, [isDragging]);
  if (!piece || !pieceImage) return null;
  return (
    <div
      ref={(node) => {
        drag(node);
        pieceRef.current = node;
        // Detach the react-dnd connector and drop our own node ref on unmount.
        // Otherwise the backend's node-bound listener keeps this piece <img>
        // detached-but-alive, leaking ~12 nodes per board unmount (route change).
        return () => {
          drag(null);
          pieceRef.current = null;
        };
      }}
      className={`
          flex items-center justify-center
          select-none
          ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
        `}
      style={{
        width: size,
        height: size,
        opacity: isDragging ? 0 : disabled ? 0.5 : 1,
        transition: isDragging
          ? 'none'
          : 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        visibility: isDragging ? 'hidden' : 'visible',
        contain: 'layout style',
        // Only suppress native touch gestures (pan/scroll) ON this draggable so
        // the TouchBackend owns the gesture; the rest of the page scrolls
        // normally. Set inline (not the global `touch-none` class) so a finger
        // that starts on a piece can still trigger a scroll via the backend's
        // `scrollAngleRanges`, while a horizontal/diagonal drag starts a move.
        touchAction: disabled ? 'auto' : 'none'
      }}
      // Decorative for assistive tech: the wrapping control (palette button or
      // board gridcell) names the piece, so this inner drag source is silent to
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
          // SVG pieces are vector data — let the browser rasterize them at the
          // real device-pixel size for maximum crispness. (A `translateZ`/GPU
          // layer here is COUNTER-productive: it bakes the SVG into a texture at
          // the element's fractional CSS box and then resamples it, which is
          // exactly what softened the pieces. No transform = no resample.)
          imageRendering: 'auto'
        }}
        draggable={false}
      />
    </div>
  );
});
DraggablePiece.displayName = 'DraggablePiece';
export default DraggablePiece;
