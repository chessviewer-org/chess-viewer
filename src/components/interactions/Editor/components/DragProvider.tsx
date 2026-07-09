import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from 'react';
import type { ChessDragData } from '@constants';
import { DragCtx, type DragSession } from '@hooks';

interface DragProviderProps {
  children: ReactNode;
  onDragEnd(
    dragData: ChessDragData,
    targetId: string | null,
    targetData: Record<string, unknown> | null
  ): void;
}

export function DragProvider({ children, onDragEnd }: DragProviderProps) {
  const [active, setActive] = useState<ChessDragData | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sessionRef = useRef<DragSession | null>(null);
  const overIdRef = useRef<string | null>(null);
  const targets = useRef<
    Map<string, { el: HTMLElement; data: Record<string, unknown> }>
  >(new Map());

  const hitTest = useCallback((x: number, y: number): string | null => {
    for (const [id, { el }] of targets.current) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return id;
    }
    return null;
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = sessionRef.current;
      if (!s) return;
      s.ghost.style.transform = `translate(${e.clientX - s.halfSize}px,${e.clientY - s.halfSize}px)`;
      const id = hitTest(e.clientX, e.clientY);
      if (id !== overIdRef.current) {
        overIdRef.current = id;
        setOverId(id);
      }
    };

    const onUp = () => {
      const s = sessionRef.current;
      if (!s) return;
      s.ghost.remove();
      const tid = overIdRef.current;
      const target = tid ? (targets.current.get(tid) ?? null) : null;
      sessionRef.current = null;
      overIdRef.current = null;
      setActive(null);
      setOverId(null);
      onDragEnd(s.dragData, tid, target?.data ?? null);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [hitTest, onDragEnd]);

  const startDrag = useCallback((session: DragSession) => {
    sessionRef.current = session;
    document.body.appendChild(session.ghost);
    setActive(session.dragData);
  }, []);

  const registerDropTarget = useCallback(
    (id: string, el: HTMLElement, data: Record<string, unknown>) => {
      targets.current.set(id, { el, data });
    },
    []
  );

  const unregisterDropTarget = useCallback((id: string) => {
    targets.current.delete(id);
  }, []);

  return (
    <DragCtx.Provider
      value={{
        active,
        overId,
        _startDrag: startDrag,
        registerDropTarget,
        unregisterDropTarget
      }}
    >
      {children}
    </DragCtx.Provider>
  );
}
