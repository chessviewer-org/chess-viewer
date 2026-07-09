import { useCallback } from 'react';
import type { ChessDragData } from '@constants';
import type { PieceSymbol } from '@app-types';
import { useDragContext } from '@hooks';
import { DragProvider } from '../components/DragProvider';

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
  const { active: activeDragData } = useDragContext();

  const onDragEnd = useCallback(
    (
      dragData: ChessDragData,
      targetId: string | null,
      targetData: Record<string, unknown> | null
    ) => {
      if (!targetId) return;

      if (targetId === 'trash') {
        if (
          !dragData.isFromPalette &&
          dragData.fromRow !== undefined &&
          dragData.fromCol !== undefined
        ) {
          handlePieceRemove(dragData.fromRow, dragData.fromCol);
        }
        return;
      }

      if (targetData && typeof targetData['row'] === 'number') {
        handlePieceDrop(
          dragData.piece,
          dragData.fromRow,
          dragData.fromCol,
          targetData['row'] as number,
          targetData['col'] as number,
          dragData.isFromPalette
        );
      }
    },
    [handlePieceDrop, handlePieceRemove]
  );

  return { activeDragData, DragProvider, onDragEnd };
}
