import { ReactNode } from 'react';

import { DndProvider as ReactDndProvider } from 'react-dnd';
import { TouchBackend, TouchBackendOptions } from 'react-dnd-touch-backend';

/** Props for the `DndProvider` wrapper. */
export interface DndProviderProps {
  children: ReactNode;
}

const BACKEND_OPTIONS: Partial<TouchBackendOptions> = {
  enableMouseEvents: true,
  enableTouchEvents: true,
  // Shorter than the old 200ms so a drag feels responsive, but long enough that
  // a quick flick/tap to scroll the page is not mistaken for a drag.
  delayTouchStart: 120,
  delayMouseStart: 0,
  touchSlop: 10,
  ignoreContextMenu: true,
  // Let a mostly-vertical finger swipe scroll the page instead of starting a
  // drag: the two ranges below (≈ straight up and straight down, ±25°) are
  // treated as scroll gestures, so the page never "freezes" under the finger
  // when the user means to scroll past the board. Horizontal/diagonal motion
  // still starts a piece drag.
  scrollAngleRanges: [
    { start: 65, end: 115 }, // downward swipe → scroll
    { start: 245, end: 295 } // upward swipe → scroll
  ]
};

function DndProvider({ children }: DndProviderProps) {
  return (
    <ReactDndProvider backend={TouchBackend} options={BACKEND_OPTIONS}>
      {children}
    </ReactDndProvider>
  );
}

export default DndProvider;
