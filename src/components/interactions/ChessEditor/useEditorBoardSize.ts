import { useEffect, useRef, useState } from 'react';

/** Pixel-align a raw board size down to a multiple of 8 (one full cell). */
const align8 = (raw: number) => Math.floor(raw / 8) * 8;

const getGutterSize = (boardSize: number) => Math.round(boardSize / 16);

/**
 * Observes the editor container width and derives a pixel-aligned board size.
 * The visual layout is driven entirely by SCSS (`aspect-ratio: 1/1`); this hook
 * merely tracks the rendered size so the Export pipeline knows what resolution
 * to target.
 *
 * @param showCoords - Whether coordinate labels are rendered (kept for signature compat)
 * @returns `boardSize`, `gutterSize`, and a `containerRef` to attach to the wrapper element.
 */
export function useEditorBoardSize(showCoords: boolean) {
  const [boardSize, setBoardSize] = useState(400);
  const [gutterSize, setGutterSize] = useState(() => getGutterSize(400));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          // The board container width is dictated by SCSS. We just align it.
          const next = Math.max(200, align8(width));
          setBoardSize(next);
          setGutterSize(getGutterSize(next));
        }
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [showCoords]);

  return { boardSize, gutterSize, containerRef };
}
