import { memo } from 'react';

import type { ChessDragData } from '@constants';
import { useDragContext, useDroppable } from '@hooks';

interface TrashZoneProps {
  className?: string;
}

export const TrashZone = memo(function TrashZone({
  className = ''
}: TrashZoneProps) {
  const { active } = useDragContext();
  const dragData = active as ChessDragData | null;
  const canDrop = !!active && !dragData?.isFromPalette;

  const { setNodeRef, isOver } = useDroppable({ id: 'trash', data: {} });

  const isActive = isOver && canDrop;

  return (
    <div
      ref={setNodeRef}
      className={`
        flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5
        rounded-lg border-2 overflow-hidden
        transition-[background-color,color,box-shadow,flex-grow,transform] duration-200 ease-out
        ${
          isActive
            ? 'marching-ants border-transparent grow bg-error/30 text-error shadow-lg shadow-error/30'
            : canDrop
              ? 'border-dashed border-warning/40 hover:border-warning/60 bg-surface-elevated/50 text-text-muted hover:text-warning'
              : 'border-dashed border-border/30 bg-surface-elevated/30 text-text-muted'
        }
        ${className}
      `}
      aria-hidden="true"
    >
      <svg
        className="w-5 h-5 shrink-0 transition-colors duration-200"
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
      <span className="text-sm font-semibold truncate transition-colors duration-200">
        {isActive ? 'Release to remove' : 'Drop to remove'}
      </span>
    </div>
  );
});

TrashZone.displayName = 'TrashZone';
