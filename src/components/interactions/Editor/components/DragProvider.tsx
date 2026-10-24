import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode
} from 'react';
import type { ChessDragData } from '@constants';
import {
  DRAG_OVER_ATTR,
  DROP_ID_ATTR,
  DragApiCtx,
  type DragApi,
  type DragSession
} from '@/shared/hooks/useDragDrop';

const CLICK_SUPPRESS_MS = 50;

interface DragProviderProps {
  children: ReactNode;
  onDragEnd(
    dragData: ChessDragData,
    targetId: string | null,
    targetData: Record<string, unknown> | null
  ): void;
}

function hitTest(x: number, y: number): string | null {
  const el = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>(`[${DROP_ID_ATTR}]`);
  return el?.getAttribute(DROP_ID_ATTR) ?? null;
}

function suppressNextClick() {
  const block = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  window.addEventListener('click', block, { capture: true, once: true });
  setTimeout(
    () => window.removeEventListener('click', block, { capture: true }),
    CLICK_SUPPRESS_MS
  );
}

export function DragProvider({ children, onDragEnd }: DragProviderProps) {
  const activeRef = useRef<ChessDragData | null>(null);
  const listeners = useRef(new Set<() => void>());
  const setActive = useCallback((next: ChessDragData | null) => {
    if (activeRef.current === next) return;
    activeRef.current = next;
    listeners.current.forEach((listener) => listener());
  }, []);

  const sessionRef = useRef<DragSession | null>(null);
  const overIdRef = useRef<string | null>(null);
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;
  const targets = useRef<
    Map<string, { el: HTMLElement; data: Record<string, unknown> }>
  >(new Map());

  const setOver = useCallback((id: string | null) => {
    if (id === overIdRef.current) return;
    const prev = overIdRef.current;
    if (prev) targets.current.get(prev)?.el.removeAttribute(DRAG_OVER_ATTR);
    if (id) targets.current.get(id)?.el.setAttribute(DRAG_OVER_ATTR, '');
    overIdRef.current = id;
  }, []);

  useLayoutEffect(() => {
    let frame = 0;
    let lastX = 0;
    let lastY = 0;

    const render = () => {
      frame = 0;
      const s = sessionRef.current;
      if (!s) return;
      s.ghost.style.transform = `translate3d(${lastX - s.halfSize}px,${lastY - s.halfSize}px,0)`;
      setOver(hitTest(lastX, lastY));
    };

    const finish = (targetId: string | null) => {
      const s = sessionRef.current;
      if (!s) return;
      cancelAnimationFrame(frame);
      frame = 0;
      s.ghost.remove();
      sessionRef.current = null;
      setOver(null);
      setActive(null);
      suppressNextClick();
      if (!targetId) return;
      const target = targets.current.get(targetId) ?? null;
      onDragEndRef.current(s.dragData, targetId, target?.data ?? null);
    };

    const isSessionPointer = (e: PointerEvent) =>
      sessionRef.current?.pointerId === e.pointerId;

    const onMove = (e: PointerEvent) => {
      if (!isSessionPointer(e)) return;
      e.preventDefault();
      lastX = e.clientX;
      lastY = e.clientY;
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onUp = (e: PointerEvent) => {
      if (isSessionPointer(e)) finish(hitTest(e.clientX, e.clientY));
    };

    const onCancel = (e: PointerEvent) => {
      if (isSessionPointer(e)) finish(null);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sessionRef.current) finish(null);
    };

    const onBlur = () => finish(null);

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', onBlur);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', onBlur);
      sessionRef.current?.ghost.remove();
      sessionRef.current = null;
      setActive(null);
    };
  }, [setOver, setActive]);

  const api = useMemo<DragApi>(
    () => ({
      startDrag(session) {
        sessionRef.current = session;
        document.body.appendChild(session.ghost);
        setActive(session.dragData);
      },
      isDragging: () => sessionRef.current !== null,
      getActive: () => activeRef.current,
      subscribe(listener) {
        listeners.current.add(listener);
        return () => listeners.current.delete(listener);
      },
      registerDropTarget(id, el, data) {
        el.setAttribute(DROP_ID_ATTR, id);
        targets.current.set(id, { el, data });
      },
      unregisterDropTarget(id) {
        targets.current.delete(id);
      }
    }),
    [setActive]
  );

  return <DragApiCtx.Provider value={api}>{children}</DragApiCtx.Provider>;
}
