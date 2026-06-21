import { useEffect, useRef, useState } from 'react';

// Modest trim for breathing room beneath the board on desktop. The right panel
// is a tall "command center" (palette + display options + DB search + action
// bar), so the board no longer needs an aggressive shrink to align.
const BOARD_SHRINK_PX = 24;

// Absolute floor — only reached when the container is genuinely unmeasurable
// (0-width during first paint / hidden). Real phones always measure a width and
// drive a height-aware size well above this, so the floor never forces overflow.
const MIN_BOARD_PX = 200;

// fraction of the post-chrome height so the right panel reflows beside it.
// ~0.88 leaves headroom for the card padding and gaps so nothing overflows 100vh.
const DESKTOP_BOARD_VH = 0.88;

// Reserved vertical space inside the viewport that is NOT the board. Subtracted
// from the viewport height before applying the VH fraction so the height budget
// reflects the real space the board column gets.
//   Mobile: navbar gap + FEN toolbar (board is ABOVE the tool strip).
//   Tablet: navbar + FEN toolbar + DB search (now moved below board) + padding.
//   Desktop: navbar (64) + FEN toolbar (56) + card padding (28×2) + gap (8×2) + page py (16).
const DESKTOP_VERTICAL_CHROME = 300;

/** Pixel-align a raw board size down to a multiple of 8 (one full cell). */
const align8 = (raw: number) => Math.floor(raw / 8) * 8;

/** Live viewport height, preferring visualViewport (excludes mobile URL bar). */
function getViewportHeight(): number {
  if (typeof window === 'undefined') return 0;
  return window.visualViewport?.height ?? window.innerHeight ?? 0;
}

/**
 * Derive a board size that fits BOTH the measured container width and the
 * available viewport height.
 */
function calculateBoardSize(
  containerWidth: number,
  viewportHeight: number
): number {
  if (containerWidth <= 0) return MIN_BOARD_PX;

  const widthFactor = 1.0625; // Always reserve coordinate gutter space so toggling doesn't resize the board
  // Breakpoints MUST track the container-query variants the editor renders with:
  //   < 576  → single column  (`@xl` not yet active: board stacks above right panel)
  //   < 1024 → side-by-side  (`@xl` active; DB search is IN the right panel always)
  //   ≥ 1024 → desktop        (`@5xl` — right column height is pinned to board)
  const isSingleColumn = containerWidth < 576;
  const isTablet = !isSingleColumn && containerWidth < 1024;

  // ── Width budget ──────────────────────────────────────────────────────
  let widthRaw: number;
  if (isSingleColumn) {
    widthRaw = Math.min(containerWidth / widthFactor, 440);
  } else {
    // Tablet shares the row with the palette/options/trash column. The board
    // takes ~55% so the right panel (~45%) has enough room for the palette
    // without wrapping. Desktop keeps the wider 0.8 share. Cap raised to 520
    // so boards on wider tablets don't appear undersized.
    const shrunk = containerWidth * (isTablet ? 0.55 : 0.8) - BOARD_SHRINK_PX;
    widthRaw = Math.min(shrunk / widthFactor, 520);
  }

  // ── Height budget ─────────────────────────────────────────────────────
  let heightRaw = Infinity;
  if (viewportHeight > 0 && !isSingleColumn && !isTablet) {
    // Only lock to viewport height on DESKTOP
    const chrome = DESKTOP_VERTICAL_CHROME;
    const vhFraction = DESKTOP_BOARD_VH;
    const available = Math.max(viewportHeight - chrome, 0);
    heightRaw = (available * vhFraction) / widthFactor;
  }

  const raw = Math.min(widthRaw, heightRaw);
  return Math.max(MIN_BOARD_PX, align8(raw));
}

const getGutterSize = (boardSize: number) => Math.round(boardSize / 16);

/**
 * Observes the editor container width AND the viewport height, then derives a
 * pixel-aligned board size that fits both axes.
 *
 * Height-awareness is what prevents the mobile clipping: the editor lives inside
 * a `h-dvh overflow-hidden` shell with its own scroll, so a width-only size let
 * the board + palette + panels overflow vertically. We clamp the board to a
 * fraction of the live viewport height so the tool strip below it stays visible.
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

    // The latest measured container width; height comes from the viewport, not
    // the container (the container grows with content inside the scroll area).
    let lastWidth = container.getBoundingClientRect().width;

    const recompute = () => {
      if (lastWidth <= 0) return;
      const next = calculateBoardSize(lastWidth, getViewportHeight());
      setBoardSize(next);
      setGutterSize(getGutterSize(next));
    };

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) lastWidth = width;
      }
      recompute();
    });
    observer.observe(container);

    // The viewport height changes independently of the container width (mobile
    // URL bar show/hide, rotation, keyboard) — listen for both.
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', recompute);
    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);

    recompute();

    return () => {
      observer.disconnect();
      viewport?.removeEventListener('resize', recompute);
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
    };
  }, [showCoords]);

  return { boardSize, gutterSize, containerRef };
}
