import { useCallback, useState } from 'react';
import type { BoardPreset } from '@/shared/types';

interface UsePresetDndOptions {
  setPresets: React.Dispatch<React.SetStateAction<BoardPreset[]>>;
}

export function usePresetDnd({ setPresets }: UsePresetDndOptions) {
  const [draggedPreset, setDraggedPreset] = useState<BoardPreset | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback(
    (_e: React.DragEvent, preset: BoardPreset) => setDraggedPreset(preset),
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent, preset: BoardPreset) => {
    e.preventDefault();
    setDragOverId(preset.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedPreset(null);
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (_e: React.DragEvent, targetPreset: BoardPreset) => {
      if (!draggedPreset || draggedPreset.id === targetPreset.id) return;

      setPresets((prev) => {
        const next = [...prev];
        const dragIndex = next.findIndex((p) => p.id === draggedPreset.id);
        const targetIndex = next.findIndex((p) => p.id === targetPreset.id);
        if (dragIndex === -1 || targetIndex === -1) return prev;
        const [removed] = next.splice(dragIndex, 1);
        next.splice(targetIndex, 0, removed!);
        return next;
      });

      setDraggedPreset(null);
      setDragOverId(null);
    },
    [draggedPreset, setPresets]
  );

  return { dragOverId, handleDragStart, handleDragOver, handleDragEnd, handleDrop };
}
