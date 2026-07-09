import { memo, useMemo } from 'react';

import { type ChessDragData } from '@constants';
import type { PieceSymbol } from '@app-types';
import { useDraggable } from '@hooks';
import { getPieceKey } from '@utils';

interface DraggablePieceProps {
  piece: PieceSymbol | '';
  pieceImage: HTMLImageElement | null;
  row?: number;
  col?: number;
  isFromPalette?: boolean;
  size?: string;
  disabled?: boolean;
  cellSize?: number;
}

export const DraggablePiece = memo(function DraggablePiece({
  piece,
  pieceImage,
  row,
  col,
  isFromPalette = false,
  size = '85%',
  disabled = false,
  cellSize = 64
}: DraggablePieceProps) {
  const pieceKey = piece ? getPieceKey(piece) : null;

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

  const { isDragging, onPointerDown } = useDraggable({
    data: dragData,
    cellSize,
    imageSrc: pieceImage?.src ?? null,
    disabled: disabled || !piece
  });

  if (!piece || !pieceImage) return null;

  return (
    <div
      onPointerDown={onPointerDown}
      className={`
        flex items-center justify-center
        select-none
        ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
      `}
      style={{
        width: size,
        height: size,
        opacity: isDragging ? 0 : disabled ? 0.5 : 1,
        visibility: isDragging ? 'hidden' : 'visible',
        transition: isDragging
          ? 'none'
          : 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        contain: 'strict',
        touchAction: disabled ? 'auto' : 'none',
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
