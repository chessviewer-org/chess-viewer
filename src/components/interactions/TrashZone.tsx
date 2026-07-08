import { memo } from 'react';

import { useDndContext, useDroppable } from '@dnd-kit/core';

import type { ChessDragData } from '@constants';

/** Props for the `TrashZone` drop-to-delete target. */
interface TrashZoneProps {
  id?: string;
  className?: string;
  minimal?: boolean;
}

/**
 * A drop zone that removes a piece from the board.
 *
 * Drop ID: `"trash"` — handled by `ChessEditor.handleDragEnd`.
 *
 * This component does NOT call `handlePieceRemove` directly. Removal is
 * centralised in `ChessEditor.handleDragEnd`, which checks `over.id === 'trash'`
 * and skips palette pieces (`isFromPalette`).
 *
 * The zone arms itself (`canDrop = true`) only while a board piece is being
 * dragged — palette drags leave it fully idle. This check uses `useDndContext`
 * to read the active drag's data without prop-threading.
 */
const TrashZone = memo(function TrashZone({
  id = 'trash',
  className = '',
  minimal = false
}: TrashZoneProps) {
  const { active } = useDndContext();
  const dragData = active?.data.current as ChessDragData | undefined;
  // Arm the zone only for board pieces (not palette drags).
  const canDrop = !!active && !dragData?.isFromPalette;

  const { setNodeRef, isOver } = useDroppable({
    id
  });

  const active_ = isOver && canDrop;

  if (minimal) {
    return (
      <div
        ref={setNodeRef}
        className={`
          transition-all duration-200
          ${active_ ? 'bg-error/20 border-error' : canDrop ? 'bg-surface-elevated/50 border-border/50' : 'bg-transparent border-transparent'}
          ${className}
        `}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5
        rounded-lg border-2 overflow-hidden
        transition-[background-color,color,box-shadow,flex-grow,transform] duration-200 ease-out
        ${
          active_
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
        {active_ ? 'Release to remove' : 'Drop to remove'}
      </span>
    </div>
  );
});

TrashZone.displayName = 'TrashZone';
export default TrashZone;
