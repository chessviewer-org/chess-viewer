import { memo, useMemo } from 'react';

import { type ChessDragData } from '@constants';
import type { BoardCell } from '@app-types';
import { useDraggable } from '@/shared/hooks/useDragDrop';
import { getPieceKey } from '@/shared/utils/pieceUtils';

interface DraggablePieceProps {
  piece: BoardCell;
  pieceImage: HTMLImageElement | null;
  row?: number;
  col?: number;
  isFromPalette?: boolean;
  size?: string;
  disabled?: boolean;
}

export const DraggablePiece = memo(function DraggablePiece({
  piece,
  pieceImage,
  row,
  col,
  isFromPalette = false,
  size = '85%',
  disabled = false
}: DraggablePieceProps) {
  const pieceKey = piece ? getPieceKey(piece) : null;

  const dragData = useMemo<ChessDragData>(
    () => ({
      piece,
      pieceKey,
      fromRow: row,
      fromCol: col,
      isFromPalette
    }),
    [piece, pieceKey, row, col, isFromPalette]
  );

  const { isDragging, onPointerDown, touchRef } = useDraggable({
    data: dragData,
    imageSrc: pieceImage?.src ?? null,
    disabled: disabled || !piece
  });

  if (!piece || !pieceImage) return null;

  return (
    <div
      ref={touchRef}
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
      className={`
        flex items-center justify-center
        select-none
        ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={{
        width: size,
        height: size,
        opacity: isDragging ? 0 : disabled ? 0.5 : 1,
        visibility: isDragging ? 'hidden' : 'inherit',
        transition: isDragging
          ? 'none'
          : 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        contain: 'strict',
        touchAction: 'manipulation',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
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
          imageRendering: 'auto'
        }}
        draggable={false}
      />
    </div>
  );
});

DraggablePiece.displayName = 'DraggablePiece';
