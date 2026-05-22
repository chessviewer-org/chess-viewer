import { memo } from 'react';

import { useDrop } from 'react-dnd';

import { ItemTypes } from '@constants';
import type { DragItem } from '../DroppableSquare/DroppableSquare';

export interface TrashZoneProps {
  onDrop?: (fromRow: number, fromCol: number) => void;
  className?: string;
  minimal?: boolean;
}

export const TrashZone = memo(function TrashZone({
  onDrop,
  className = '',
  minimal = false
}: TrashZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: ItemTypes.PIECE,
      drop: (item: DragItem) => {
        if (
          !item.isFromPalette &&
          item.fromRow !== undefined &&
          item.fromCol !== undefined
        ) {
          if (onDrop) {
            onDrop(item.fromRow, item.fromCol);
          }
        }
      },
      canDrop: (item: DragItem) => !item.isFromPalette,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
      })
    }),
    [onDrop]
  );

  if (minimal) {
    return (
      <div
        ref={(node) => {
          if (node) drop(node);
        }}
        className={`
          transition-all duration-200
          ${isOver && canDrop ? 'bg-error/20 border-error' : canDrop ? 'bg-surface-elevated/50 border-border/50' : 'bg-transparent border-transparent'}
          ${className}
        `}
      />
    );
  }

  return (
    <div
      ref={(node) => {
        if (node) drop(node);
      }}
      className={`
        flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5
        rounded-lg border-2 border-dashed overflow-hidden
        transition-all duration-200
        ${isOver && canDrop ? 'bg-error/30 border-error text-error shadow-lg shadow-error/30' : canDrop ? 'bg-surface-elevated/50 border-warning/40 hover:border-warning/60 text-text-muted hover:text-warning' : 'bg-surface-elevated/30 border-border/30 text-text-muted'}
        ${className}
      `}
      role="button"
      aria-label="Drop here to remove piece"
    >
      <svg
        className={`w-5 h-5 shrink-0 transition-colors duration-200`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
      <span
        className={`text-sm font-semibold truncate transition-colors duration-200`}
      >
        {isOver && canDrop ? 'Release to remove' : 'Drop to remove'}
      </span>
    </div>
  );
});

TrashZone.displayName = 'TrashZone';
export default TrashZone;
