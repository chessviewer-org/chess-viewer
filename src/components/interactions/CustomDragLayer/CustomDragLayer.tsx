import { memo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDragLayer, DragLayerMonitor } from 'react-dnd';
import { ItemTypes } from '@/constants';

import { DragItem } from '@/components/interactions/DroppableSquare/DroppableSquare';

const selectDragState = (monitor: DragLayerMonitor) => ({
  item: monitor.getItem() as DragItem | null,
  itemType: monitor.getItemType(),
  currentOffset: monitor.getClientOffset(),
  isDragging: monitor.isDragging()
});

export interface CustomDragLayerProps {
  pieceImages: Record<string, HTMLImageElement | null>;
  boardSize?: number;
}

const CustomDragLayer = memo(function CustomDragLayer({
  pieceImages,
  boardSize = 400
}: CustomDragLayerProps) {
  const collected = useDragLayer(selectDragState);
  const rafRef = useRef<number | null>(null);
  const divRef = useRef<HTMLDivElement | null>(null);

  const pieceSize = Math.round((boardSize / 8) * 0.85);
  const { itemType, isDragging, item, currentOffset } = collected;

  useEffect(() => {
    if (!currentOffset) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      if (divRef.current) {
        const x = Math.round(currentOffset.x - pieceSize / 2);
        const y = Math.round(currentOffset.y - pieceSize / 2);
        divRef.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      }
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [currentOffset, pieceSize]);

  if (
    !isDragging ||
    itemType !== ItemTypes.PIECE ||
    typeof document === 'undefined'
  ) {
    return null;
  }

  const pieceImage = item?.pieceKey ? pieceImages[item.pieceKey] : null;
  if (!pieceImage) return null;

  if (!currentOffset) return null;

  const layerStyles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 10000,
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
  };

  return createPortal(
    <div style={layerStyles} aria-hidden="true">
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
