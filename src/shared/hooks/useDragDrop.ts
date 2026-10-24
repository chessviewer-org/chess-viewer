import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useSyncExternalStore
} from 'react';
import type { ChessDragData } from '@constants';
import { dragThreshold } from '@/shared/utils/a11yUtils';

export const DROP_ID_ATTR = 'data-drop-id';
export const DRAG_OVER_ATTR = 'data-drag-over';

const TOUCH_GHOST_SCALE = 1.4;
const TOUCH_HOLD_MS = 200;

export interface DragSession {
  dragData: ChessDragData;
  ghost: HTMLDivElement;
  halfSize: number;
  pointerId: number;
}

export interface DragApi {
  startDrag(session: DragSession): void;
  isDragging(): boolean;
  getActive(): ChessDragData | null;
  subscribe(listener: () => void): () => void;
  registerDropTarget(
    id: string,
    el: HTMLElement,
    data: Record<string, unknown>
  ): void;
  unregisterDropTarget(id: string): void;
}

export const DragApiCtx = createContext<DragApi>({
  startDrag: () => {},
  isDragging: () => false,
  getActive: () => null,
  subscribe: () => () => {},
  registerDropTarget: () => {},
  unregisterDropTarget: () => {}
});

export function useDragSelector<T>(
  select: (active: ChessDragData | null) => T
): T {
  const { subscribe, getActive } = useContext(DragApiCtx);
  return useSyncExternalStore(subscribe, () => select(getActive()));
}

function createGhost(src: string, size: number, x: number, y: number) {
  const half = size / 2;
  const ghost = document.createElement('div');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    `width:${size}px`,
    `height:${size}px`,
    'pointer-events:none',
    'z-index:9999',
    'will-change:transform',
    'contain:strict',
    `transform:translate3d(${x - half}px,${y - half}px,0)`
  ].join(';');

  const img = document.createElement('img');
  img.src = src;
  img.draggable = false;
  img.style.cssText = [
    'width:100%',
    'height:100%',
    'object-fit:contain',
    'filter:drop-shadow(0 4px 8px rgba(0,0,0,0.35))',
    'pointer-events:none',
    'user-select:none',
    '-webkit-user-select:none'
  ].join(';');
  ghost.appendChild(img);
  return { ghost, half };
}

interface UseDraggableOptions {
  data: ChessDragData;
  imageSrc: string | null;
  disabled?: boolean;
}

export function useDraggable({
  data,
  imageSrc,
  disabled
}: UseDraggableOptions) {
  const { startDrag, isDragging: dragInProgress } = useContext(DragApiCtx);
  const dataRef = useRef(data);
  dataRef.current = data;
  const touchElRef = useRef<HTMLElement | null>(null);

  const isDragging = useDragSelector(
    (active) =>
      !!active &&
      active.piece === data.piece &&
      active.fromRow === data.fromRow &&
      active.fromCol === data.fromCol &&
      active.isFromPalette === data.isFromPalette
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabled || !imageSrc || !e.isPrimary || dragInProgress()) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      const el = e.currentTarget as HTMLElement;
      const { clientX: startX, clientY: startY, pointerId, pointerType } = e;
      const threshold = dragThreshold(pointerType);
      const needsHold = pointerType !== 'mouse';
      let holdTimer = 0;

      el.setPointerCapture(pointerId);

      const cleanup = () => {
        window.clearTimeout(holdTimer);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', cleanup);
        el.removeEventListener('pointercancel', cleanup);
        if (el.hasPointerCapture(pointerId))
          el.releasePointerCapture(pointerId);
      };

      const begin = (x: number, y: number) => {
        cleanup();
        const { width, height } = el.getBoundingClientRect();
        const scale = pointerType === 'mouse' ? 1 : TOUCH_GHOST_SCALE;
        const { ghost, half } = createGhost(
          imageSrc,
          Math.max(width, height) * scale,
          x,
          y
        );
        startDrag({
          dragData: dataRef.current,
          ghost,
          halfSize: half,
          pointerId
        });
      };

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < threshold)
          return;
        if (needsHold) {
          cleanup();
          return;
        }
        ev.preventDefault();
        begin(ev.clientX, ev.clientY);
      };

      if (needsHold) {
        holdTimer = window.setTimeout(
          () => begin(startX, startY),
          TOUCH_HOLD_MS
        );
      }

      el.addEventListener('pointermove', onMove, { passive: false });
      el.addEventListener('pointerup', cleanup);
      el.addEventListener('pointercancel', cleanup);
    },
    [disabled, imageSrc, startDrag, dragInProgress]
  );

  const blockTouchScroll = useCallback(
    (ev: TouchEvent) => {
      if (dragInProgress()) ev.preventDefault();
    },
    [dragInProgress]
  );

  const touchRef = useCallback(
    (el: HTMLElement | null) => {
      touchElRef.current?.removeEventListener('touchmove', blockTouchScroll);
      touchElRef.current = el;
      el?.addEventListener('touchmove', blockTouchScroll, { passive: false });
    },
    [blockTouchScroll]
  );

  return { isDragging, onPointerDown, touchRef };
}

interface UseDroppableOptions {
  id: string;
  data: Record<string, unknown>;
}

export function useDroppable({ id, data }: UseDroppableOptions) {
  const { registerDropTarget, unregisterDropTarget } = useContext(DragApiCtx);
  const stateRef = useRef({ data, registerDropTarget, unregisterDropTarget });
  stateRef.current = { data, registerDropTarget, unregisterDropTarget };

  return useCallback(
    (el: HTMLElement | null) => {
      if (el) {
        stateRef.current.registerDropTarget(id, el, stateRef.current.data);
      } else {
        stateRef.current.unregisterDropTarget(id);
      }
    },
    [id]
  );
}
