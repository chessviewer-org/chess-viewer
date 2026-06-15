import { ReactNode, useMemo } from 'react';

import { DndProvider as ReactDndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend, TouchBackendOptions } from 'react-dnd-touch-backend';

/** Props for the `DndProvider` wrapper. */
export interface DndProviderProps {
  children: ReactNode;
}

/**
 * Touch-device options. `enableMouseEvents` lets a hybrid device (touchscreen
 * laptop) still drag with the trackpad, while the scroll-angle ranges let a
 * mostly-vertical finger swipe scroll the page instead of starting a drag.
 *
 * IMPORTANT — `delayTouchStart` must stay 0 so it does NOT fight
 * `scrollAngleRanges`. In react-dnd-touch-backend@16, while the delay timer is
 * pending the backend's `waitingForDelay` flag short-circuits `handleTopMove`
 * BEFORE the scroll-angle check runs (TouchBackendImpl `handleTopMove`: the
 * `waitingForDelay` early-return precedes the `inAngleRanges` branch). Combined
 * with `touch-action: none` on the piece, the page froze under the finger for
 * the whole delay window and a vertical scroll that drifted past `touchSlop`
 * was then mis-read as a drag. With no delay, the very first touchmove is
 * classified immediately: a near-vertical swipe latches `_isScrolling` and the
 * page scrolls; a horizontal/diagonal move past `touchSlop` starts the drag.
 * `touchSlop` (not a timer) is what prevents an accidental drag from a tap.
 */
const TOUCH_BACKEND_OPTIONS: Partial<TouchBackendOptions> = {
  enableMouseEvents: true,
  enableTouchEvents: true,
  // No start delay — let scrollAngleRanges + touchSlop arbitrate scroll-vs-drag
  // on the first move instead (a non-zero delay disables the angle check; see
  // the note above). delayMouseStart stays 0 for an instant trackpad drag.
  delayTouchStart: 0,
  delayMouseStart: 0,
  // A finger must travel ~12px before a drag begins, so a tap (and the tiny
  // jitter at the start of a scroll) never grabs a piece. Slightly above the
  // old 10px to be more forgiving of an imperfectly-still finger.
  touchSlop: 12,
  ignoreContextMenu: true,
  // A mostly-vertical finger swipe (≈ straight up / down, ±30°) is treated as a
  // scroll gesture, so the page never "freezes" under the finger when the user
  // means to scroll past the board. Horizontal/diagonal motion starts a drag.
  // Widened from ±25° → ±30° so a slightly-angled real scroll still scrolls.
  scrollAngleRanges: [
    { start: 60, end: 120 }, // downward swipe → scroll
    { start: 240, end: 300 } // upward swipe → scroll
  ]
};

/**
 * Detects a touch-first device once. On a touch device we use the TouchBackend
 * (the HTML5 drag-and-drop API does not fire for touch, which is exactly why
 * mobile drag "did nothing"); on a mouse/pen device we use the native
 * HTML5Backend for precise, low-overhead dragging.
 */
function prefersTouchBackend(): boolean {
  if (typeof window === 'undefined') return false;
  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const hasTouch =
    'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  return coarse || hasTouch;
}

function DndProvider({ children }: DndProviderProps) {
  // Resolve the backend once per mount. Capability does not change at runtime,
  // so this never needs to swap (which react-dnd does not support anyway).
  const { backend, options } = useMemo(() => {
    if (prefersTouchBackend()) {
      return { backend: TouchBackend, options: TOUCH_BACKEND_OPTIONS };
    }
    return { backend: HTML5Backend, options: undefined };
  }, []);

  return (
    <ReactDndProvider backend={backend} options={options}>
      {children}
    </ReactDndProvider>
  );
}

export default DndProvider;
