import { useLayoutEffect, useRef, useState } from 'react';

const align8 = (raw: number) => Math.floor(raw / 8) * 8;

export function useEditorBoardSize() {
  const [boardSize, setBoardSize] = useState(400);
  const [cellSize, setCellSize] = useState(() => Math.floor((400 * 0.95) / 8));
  const containerRef = useRef<HTMLDivElement>(null);
  const boardElementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialWidth = container.getBoundingClientRect().width;
    if (initialWidth > 0) {
      setBoardSize(Math.max(200, align8(initialWidth)));
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setBoardSize(Math.max(200, align8(width)));
        }
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const boardEl = boardElementRef.current;
    if (!boardEl) return;

    const initialWidth = boardEl.getBoundingClientRect().width;
    if (initialWidth > 0) {
      setCellSize(Math.floor(initialWidth / 8));
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setCellSize(Math.floor(width / 8));
        }
      }
    });

    observer.observe(boardEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { boardSize, cellSize, containerRef, boardElementRef };
}
