import { memo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDragLayer, DragLayerMonitor } from 'react-dnd';
import { ItemTypes } from '@/constants';

import type { DragItem } from '@/components/interactions/DroppableSquare/DroppableSquare';

interface CollectedDragState {
  item: DragItem | null;
  itemType: ReturnType<DragLayerMonitor['getItemType']>;
  currentOffset: ReturnType<DragLayerMonitor['getClientOffset']>;
  isDragging: boolean;
}

const selectDragState = (monitor: DragLayerMonitor): CollectedDragState => ({
  item: monitor.getItem() as DragItem | null,
  itemType: monitor.getItemType(),
  currentOffset: monitor.getClientOffset(),
  isDragging: monitor.isDragging()
});

export interface CustomDragLayerProps {
  pieceImages: Record<string, HTMLImageElement | null>;
  boardSize?: number;
}

const LAYER_STYLES: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 10000,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0
};


const CustomDragLayer = memo(function CustomDragLayer({
  pieceImages,
  boardSize = 400
}: CustomDragLayerProps) {
  const { isDragging, itemType, item, currentOffset } =
    useDragLayer(selectDragState);

  const rafRef = useRef<number | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);
  const pieceSize = Math.round((boardSize / 8) * 0.85);

  const updatePosition = useCallback(() => {
    if (!currentOffset || !divRef.current) return;
    const x = Math.round(currentOffset.x - pieceSize / 2);
    const y = Math.round(currentOffset.y - pieceSize / 2);
    divRef.current.style.transform = `translate3d(${x}px,${y}px,0)`;
  }, [currentOffset, pieceSize]);

  useEffect(() => {
    if (!isDragging || !currentOffset) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updatePosition);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isDragging, currentOffset, updatePosition]);

  if (
    !isDragging ||
    itemType !== ItemTypes.PIECE ||
    typeof document === 'undefined' ||
    !currentOffset
  ) {
    return null;
  }

  const pieceImage = item?.pieceKey ? pieceImages[item.pieceKey] : null;
  if (!pieceImage) return null;

  return createPortal(
    <div style={LAYER_STYLES} aria-hidden="true">
      <div
        ref={divRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: `${pieceSize}px`,
          height: `${pieceSize}px`,
          pointerEvents: 'none',
          willChange: 'transform'
        }}
      >
        <img
          src={pieceImage.src}
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 0.95,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
          draggable={false}
        />
      </div>
    </div>,
    document.body
  );
});

CustomDragLayer.displayName = 'CustomDragLayer';
export default CustomDragLayer;
