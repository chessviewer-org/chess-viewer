import { useEffect, useRef, useState } from 'react';

/** Pixel-align a raw board size down to a multiple of 8 (one full cell). */
const align8 = (raw: number) => Math.floor(raw / 8) * 8;

const getGutterSize = (boardSize: number) => Math.round(boardSize / 16);

/**
 * Observes the editor container width and derives a pixel-aligned board size.
 * Coordinates are now an overlay so the board never resizes on coord toggle.
 *
 * `cellSize` is measured from the ACTUAL rendered board element
 * (`boardElementRef` → `.editorBoardContainer`), not derived from the editor
 * container width. The two diverge on large screens: the editor root can be
 * ~900px wide while the board is clamped by `max-width` to ~520px. Deriving the
 * cell size from the container made the drag ghost (sized in `cellSize`) far
 * larger than the on-board pieces. Measuring the real square keeps the ghost
 * pixel-identical to a placed piece at every viewport.
 */
export function useEditorBoardSize() {
  const [boardSize, setBoardSize] = useState(400);
  const [gutterSize, setGutterSize] = useState(() => getGutterSize(400));
  // Real on-screen size of one square, measured from the board element below.
  const [cellSize, setCellSize] = useState(() => Math.floor((400 * 0.95) / 8));
  const containerRef = useRef<HTMLDivElement>(null);
  const boardElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
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
    // showCoords removed from deps: board size no longer changes when coords
    // toggle (coords are now an overlay inside the board container).
  }, []);

  // Measure the real board square so the drag ghost matches the placed pieces
  // regardless of any CSS max-width clamp on large screens.
  useEffect(() => {
    const boardEl = boardElementRef.current;
    if (!boardEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          // The board element is a perfect square holding the 8×8 grid, so a
          // single square is exactly width / 8.
          setCellSize(Math.floor(width / 8));
        }
      }
    });

    observer.observe(boardEl);

    return () => {
      observer.disconnect();
    };
  }, []);

  return { boardSize, gutterSize, cellSize, containerRef, boardElementRef };
}
