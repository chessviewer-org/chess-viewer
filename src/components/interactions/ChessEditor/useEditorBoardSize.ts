import { useEffect, useRef, useState } from 'react';

// Modest trim for breathing room beneath the board. The right panel is now a
// tall "command center" (two palette rows + display options + strict-mode card
// + action bar), so the board no longer needs an aggressive shrink to align.
const BOARD_SHRINK_PX = 24;

// Smallest board we will ever render. Kept low enough that the board PLUS its
// coordinate gutter still fits inside a ~327px content area on a 375px phone
// (the prior 320px floor + a ~20px gutter overflowed and clipped the board).
const MIN_BOARD_PX = 256;

function calculateBoardSize(containerWidth: number, showCoords: boolean) {
  if (containerWidth <= 0) return MIN_BOARD_PX;

  // The coordinate gutter (board/16) sits to the LEFT of the board, so the live
  // board + gutter wrapper consumes `boardSize * widthFactor`. Dividing the
  // available width by this factor guarantees the wrapper never overflows the
  // measured container, even on the narrowest phones.
  const widthFactor = showCoords ? 1.0625 : 1;

  let raw: number;
  if (containerWidth < 640) {
    // Phones: fill the container (minus the gutter) instead of forcing a fixed
    // floor that can exceed the viewport.
    raw = Math.min(containerWidth / widthFactor, 400);
  } else if (containerWidth < 1024) {
    raw = Math.min((containerWidth * 0.9) / widthFactor, 480);
  } else {
    raw = Math.min((containerWidth * 0.8) / widthFactor, 520);
  }

  // On phones the container is the constraint, so skip the alignment shrink —
  // subtracting it again risked re-introducing overflow margins of error.
  const shrink = containerWidth < 640 ? 0 : BOARD_SHRINK_PX;

  // Keep the size pixel-aligned to 8 (one full cell) after the shrink.
  return Math.max(MIN_BOARD_PX, Math.floor((raw - shrink) / 8) * 8);
}

export const getGutterSize = (boardSize: number) => Math.round(boardSize / 16);

/**
 * Observes the editor container width and derives a pixel-aligned board size.
 *
 * Accounts for the coordinate gutter when `showCoords` is true.
 *
 * @param showCoords - Whether coordinate labels are rendered.
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
          const newSize = calculateBoardSize(width, showCoords);
          setBoardSize(newSize);
          setGutterSize(getGutterSize(newSize));
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [showCoords]);

  return { boardSize, gutterSize, containerRef };
}
