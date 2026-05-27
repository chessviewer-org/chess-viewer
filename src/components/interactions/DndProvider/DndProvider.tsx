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
  delayTouchStart: 200,
  delayMouseStart: 0,
  touchSlop: 10,
  ignoreContextMenu: true
};

function DndProvider({ children }: DndProviderProps) {
  return (
    <ReactDndProvider backend={TouchBackend} options={BACKEND_OPTIONS}>
      {children}
    </ReactDndProvider>
  );
}

export default DndProvider;
