import { ReactNode } from 'react';

import { DndProvider as ReactDndProvider } from 'react-dnd';
import { TouchBackend, TouchBackendOptions } from 'react-dnd-touch-backend';

interface DndProviderProps {
  children: ReactNode;
}

// Hybrid scroll + drag on touch devices:
// - delayTouchStart is short enough to feel responsive on a deliberate press,
//   but the scrollAngleRanges below let the browser keep ownership of mostly
//   vertical swipes so the page can still scroll over the board.
// - scrollAngleRanges defines the touch-movement angles (in degrees, 0 = right,
//   90 = down) that are treated as page scrolls instead of drags. Anything
//   within ~45° of straight up or straight down scrolls the page normally.
const BACKEND_OPTIONS: Partial<TouchBackendOptions> = {
  enableMouseEvents: true,
  enableTouchEvents: true,
  delayTouchStart: 120,
  delayMouseStart: 0,
  touchSlop: 12,
  ignoreContextMenu: true,
  scrollAngleRanges: [
    { start: 30, end: 150 }, // downward swipes -> scroll
    { start: 210, end: 330 } // upward swipes -> scroll
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
