import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject
} from 'react';

import type { Square } from '@/engines/core/arrows';

export type Brush = 'green' | 'red' | 'blue' | 'yellow';

export interface Shape {
  from: Square;
  to: Square;
  brush: Brush;
}

const BRUSHES: readonly Brush[] = ['green', 'red', 'blue', 'yellow'];

function brushOf(event: ReactPointerEvent): Brush | null {
  const modifiers = (event.shiftKey ? 1 : 0) + (event.altKey ? 2 : 0);
  if (event.button === 2) return BRUSHES[modifiers]!;
  return event.button === 0 && modifiers ? BRUSHES[modifiers]! : null;
}

const sameSquare = (a: Square, b: Square) => a[0] === b[0] && a[1] === b[1];

export function useBoardDrawing(
  gridRef: RefObject<HTMLElement | null>,
  flipped: boolean
) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [pending, setPending] = useState<Shape | null>(null);
  const drawing = useRef<Shape | null>(null);

  const squareAt = useCallback(
    (x: number, y: number): Square | null => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect?.width) return null;
      const col = Math.floor(((x - rect.left) / rect.width) * 8);
      const row = Math.floor(((y - rect.top) / rect.height) * 8);
      if (col < 0 || col > 7 || row < 0 || row > 7) return null;
      return flipped ? [7 - row, 7 - col] : [row, col];
    },
    [gridRef, flipped]
  );

  const clear = useCallback(
    () => setShapes((current) => (current.length ? [] : current)),
    []
  );

  useEffect(() => {
    if (!pending) return;
    const move = (event: PointerEvent) => {
      const to = squareAt(event.clientX, event.clientY);
      const current = drawing.current;
      if (current && to && !sameSquare(current.to, to)) {
        drawing.current = { ...current, to };
        setPending(drawing.current);
      }
    };
    const finish = (event: PointerEvent) => {
      const current = drawing.current;
      drawing.current = null;
      setPending(null);
      const to = squareAt(event.clientX, event.clientY);
      if (!current || !to) return;
      const shape = { ...current, to };
      setShapes((known) => {
        const same = known.find(
          (other) =>
            sameSquare(other.from, shape.from) && sameSquare(other.to, shape.to)
        );
        const rest = known.filter((other) => other !== same);
        return same?.brush === shape.brush ? rest : [...rest, shape];
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish, { once: true });
    window.addEventListener('pointercancel', finish, { once: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
    };
  }, [pending, squareAt]);

  const onPointerDownCapture = useCallback(
    (event: ReactPointerEvent) => {
      const brush = brushOf(event);
      if (!brush) {
        if (event.button === 0) clear();
        return;
      }
      const from = squareAt(event.clientX, event.clientY);
      if (!from) return;
      event.preventDefault();
      event.stopPropagation();
      drawing.current = { from, to: from, brush };
      setPending(drawing.current);
    },
    [clear, squareAt]
  );

  return {
    shapes,
    pending,
    clear,
    handlers: {
      onPointerDownCapture,
      onContextMenu: (event: { preventDefault: () => void }) =>
        event.preventDefault()
    }
  };
}
