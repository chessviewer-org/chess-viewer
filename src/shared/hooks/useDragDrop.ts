import { createContext, useCallback, useContext, useRef } from 'react';
import type { ChessDragData } from '@constants';

// Types
export interface DragSession {
  dragData: ChessDragData;
  ghost: HTMLDivElement;
  halfSize: number;
}

export interface DragContextValue {
  active: ChessDragData | null;
  overId: string | null;
  _startDrag(session: DragSession): void;
  registerDropTarget(
    id: string,
    el: HTMLElement,
    data: Record<string, unknown>
  ): void;
  unregisterDropTarget(id: string): void;
}

// Context
export const DragCtx = createContext<DragContextValue>({
  active: null,
  overId: null,
  _startDrag: () => {},
  registerDropTarget: () => {},
  unregisterDropTarget: () => {}
});

export function useDragContext() {
  return useContext(DragCtx);
}

// Draggable
interface UseDraggableOptions {
  data: ChessDragData;
  cellSize: number;
  imageSrc: string | null;
  disabled?: boolean;
}

export function useDraggable({
  data,
  cellSize,
  imageSrc,
  disabled
}: UseDraggableOptions) {
  const { active, _startDrag } = useDragContext();
  const dataRef = useRef(data);
  dataRef.current = data;

  const isDragging =
    !!active &&
    active.piece === data.piece &&
    active.fromRow === data.fromRow &&
    active.fromCol === data.fromCol &&
    active.isFromPalette === data.isFromPalette;

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled || !imageSrc) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      e.stopPropagation();
      e.preventDefault();

      const size = cellSize * 0.9;
      const half = size / 2;

      const ghost = document.createElement('div');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.style.cssText = `position:fixed;top:0;left:0;width:${size}px;height:${size}px;pointer-events:none;z-index:9999;will-change:transform;transform:translate(${e.clientX - half}px,${e.clientY - half}px);`;

      const img = document.createElement('img');
      img.src = imageSrc;
      img.draggable = false;
      img.style.cssText = `width:100%;height:100%;object-fit:contain;opacity:0.92;filter:drop-shadow(0 3px 8px rgba(0,0,0,0.55));pointer-events:none;user-select:none;-webkit-user-select:none;`;
      ghost.appendChild(img);

      _startDrag({ dragData: dataRef.current, ghost, halfSize: half });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [disabled, imageSrc, cellSize, _startDrag]
  );

  return { isDragging, onPointerDown };
}

// Droppable
interface UseDroppableOptions {
  id: string;
  data: Record<string, unknown>;
}

export function useDroppable({ id, data }: UseDroppableOptions) {
  const { overId, registerDropTarget, unregisterDropTarget } = useDragContext();
  const dataRef = useRef(data);
  dataRef.current = data;
  const registerRef = useRef(registerDropTarget);
  registerRef.current = registerDropTarget;
  const unregisterRef = useRef(unregisterDropTarget);
  unregisterRef.current = unregisterDropTarget;

  const setNodeRef = useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        registerRef.current(id, el, dataRef.current);
      } else {
        unregisterRef.current(id);
      }
    },
    [id]
  );

  return { isOver: overId === id, setNodeRef };
}
