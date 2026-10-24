import { memo } from 'react';

import { useDragSelector, useDroppable } from '@/shared/hooks/useDragDrop';

interface TrashZoneProps {
  className?: string;
}

export const TrashZone = memo(function TrashZone({
  className = ''
}: TrashZoneProps) {
  const canDrop = useDragSelector(
    (active) => !!active && !active.isFromPalette
  );

  const setNodeRef = useDroppable({ id: 'trash', data: {} });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5
        rounded-lg border-2 overflow-hidden
        transition-[background-color,color,box-shadow,flex-grow,transform] duration-200 ease-out
        ${
          canDrop
            ? 'group border-dashed border-warning/40 hover:border-warning/60 bg-surface-elevated/50 text-text-muted hover:text-warning data-drag-over:marching-ants data-drag-over:border-transparent data-drag-over:grow data-drag-over:bg-error/30 data-drag-over:text-error data-drag-over:shadow-lg data-drag-over:shadow-error/30'
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
        <span className="group-data-drag-over:hidden">Drop to remove</span>
        <span className="hidden group-data-drag-over:inline">
          Release to remove
        </span>
      </span>
    </div>
  );
});

TrashZone.displayName = 'TrashZone';
