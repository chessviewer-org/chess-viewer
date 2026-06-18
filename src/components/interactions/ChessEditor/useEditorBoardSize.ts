import { useEffect, useRef, useState } from 'react';

// Modest trim for breathing room beneath the board on desktop. The right panel
// is a tall "command center" (palette + display options + DB search + action
// bar), so the board no longer needs an aggressive shrink to align.
const BOARD_SHRINK_PX = 24;

// Absolute floor — only reached when the container is genuinely unmeasurable
// (0-width during first paint / hidden). Real phones always measure a width and
// drive a height-aware size well above this, so the floor never forces overflow.
const MIN_BOARD_PX = 200;

// Fraction of the *post-chrome* viewport height the board may consume. On
// mobile the board sits ABOVE the palette + tab bar + active panel, so it takes
// the lion's share of what's left after the FEN toolbar; the remainder feeds
// the tool strip so NOTHING is clipped and the page never scrolls horizontally.
const MOBILE_BOARD_VH = 0.68;

// On desktop the WHOLE workspace must fit inside one viewport (no page scroll):
// navbar gap + FEN control panel + board, all within 100vh. Height is therefore
// the practical limit, not width — the board shrinks to fill exactly the space
// left after the chrome, and the right panel reflows beside it. ~0.88 leaves
// headroom for the card padding and gaps so nothing overflows 100vh.
const DESKTOP_BOARD_VH = 0.88;

// Reserved vertical space inside the viewport that is NOT the board. Subtracted
// from the viewport height before applying the VH fraction so the height budget
// reflects the real space the board column gets.
//   Mobile: navbar gap + FEN toolbar (board is ABOVE the tool strip).
//   Desktop: navbar (64) + FEN toolbar (56) + card padding (28×2) +
//   gap (8×2) + page py (16) ≈ 300px.
const MOBILE_VERTICAL_CHROME = 160;
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
 *
 * - The coordinate gutter (board/16) sits to the LEFT of the board, so the live
 *   board + gutter wrapper consumes `boardSize * widthFactor`. Dividing the
 *   available width by this factor guarantees the wrapper never overflows the
 *   measured container, even on the narrowest phones.
 * - The height budget is the dominant constraint on phones: the board is capped
 *   so the palette + tabs + active panel always remain visible beneath it.
 */
function calculateBoardSize(
  containerWidth: number,
  viewportHeight: number,
  showCoords: boolean
): number {
  if (containerWidth <= 0) return MIN_BOARD_PX;

  const widthFactor = showCoords ? 1.0625 : 1;
  const isMobile = containerWidth < 1024;

  // ── Width budget ──────────────────────────────────────────────────────
  let widthRaw: number;
  if (containerWidth < 640) {
    widthRaw = Math.min(containerWidth / widthFactor, 380);
  } else if (containerWidth < 1024) {
    widthRaw = Math.min((containerWidth * 0.92) / widthFactor, 460);
  } else {
    const shrunk = containerWidth * 0.8 - BOARD_SHRINK_PX;
    widthRaw = Math.min(shrunk / widthFactor, 480);
  }

  // ── Height budget ─────────────────────────────────────────────────────
  // The gutter adds height below the board too (the file row), so the wrapper
  // height is also `boardSize * widthFactor` when coords show — divide by the
  // same factor to get the board edge that fits the available height.
  let heightRaw = Infinity;
  if (viewportHeight > 0) {
    const chrome = isMobile ? MOBILE_VERTICAL_CHROME : DESKTOP_VERTICAL_CHROME;
    const vhFraction = isMobile ? MOBILE_BOARD_VH : DESKTOP_BOARD_VH;
    const available = Math.max(viewportHeight - chrome, 0);
    heightRaw = (available * vhFraction) / widthFactor;
  }

  const raw = Math.min(widthRaw, heightRaw);
  return Math.max(MIN_BOARD_PX, align8(raw));
}

export const getGutterSize = (boardSize: number) => Math.round(boardSize / 16);

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
      const next = calculateBoardSize(
        lastWidth,
        getViewportHeight(),
        showCoords
      );
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
