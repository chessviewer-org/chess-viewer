import { useCallback, useState } from 'react';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';

import type { ChessDragData } from '@constants';
import type { PieceSymbol } from '@app-types';

interface UseDragStateParams {
  handlePieceDrop: (
    piece: PieceSymbol,
    fromRow: number | undefined,
    fromCol: number | undefined,
    toRow: number,
    toCol: number,
    isFromPalette: boolean
  ) => void;
  handlePieceRemove: (row: number, col: number) => void;
}

export function useDragState({
  handlePieceDrop,
  handlePieceRemove
}: UseDragStateParams) {
  // PointerSensor handles both mouse and stylus; MouseSensor is the fine-pointer
  // fallback. TouchSensor handles touch-only devices with a short delay so a tap
  // doesn't accidentally start a drag (tolerance lets the finger settle 8px).
  // All three sensors are registered so @dnd-kit picks the right one per event.
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 4 }
  });
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 4 }
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 8 }
  });
  const sensors = useSensors(pointerSensor, mouseSensor, touchSensor);

  const [activeDragData, setActiveDragData] = useState<ChessDragData | null>(
    null
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as ChessDragData | undefined;
    if (data) {
      setActiveDragData(data);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragData(null);
      const { active, over } = event;
      if (!over) return;

      const dragData = active.data.current as ChessDragData | undefined;
      if (!dragData) return;

      const overId = String(over.id);

      if (overId === 'trash') {
        if (
          !dragData.isFromPalette &&
          dragData.fromRow !== undefined &&
          dragData.fromCol !== undefined
        ) {
          handlePieceRemove(dragData.fromRow, dragData.fromCol);
        }
        return;
      }

      const overData = over.data.current as
        | { row: number; col: number }
        | undefined;
      if (overData && typeof overData.row === 'number') {
        handlePieceDrop(
          dragData.piece,
          dragData.fromRow,
          dragData.fromCol,
          overData.row,
          overData.col,
          dragData.isFromPalette
        );
      }
    },
    [handlePieceDrop, handlePieceRemove]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragData(null);
  }, []);

  return {
    sensors,
    activeDragData,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  };
}
