import { useMemo, ReactNode } from 'react';

import { DndProvider as ReactDndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

declare global {
  interface Navigator {
    msMaxTouchPoints?: number;
  }
}

export interface DndProviderProps {
  children: ReactNode;
}

/**
 * Provides the correct Drag-and-Drop backend (Touch or HTML5) based on device capabilities.
 */
function DndProvider({ children }: DndProviderProps) {
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const hasTouchPoints =
        navigator.maxTouchPoints > 0 || (navigator.msMaxTouchPoints ?? 0) > 0;
      const hasFinePointer = window.matchMedia?.('(pointer: fine)').matches;
      const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;
      return Boolean(hasTouchPoints && (hasCoarsePointer || !hasFinePointer));
    } catch {
      return false;
    }
  }, []);

  const { Backend, backendOptions } = useMemo(() => {
    const touchBackendOptions = {
      enableMouseEvents: true,
      enableTouchEvents: true,
      delayTouchStart: 200,
      touchSlop: 10,
      ignoreContextMenu: true
    };

    if (isTouchDevice) {
      return {
        Backend: TouchBackend,
        backendOptions: touchBackendOptions
      };
    }

    const options =
      typeof document !== 'undefined' && document.body
        ? { rootElement: document.body }
        : {};

    return {
      Backend: HTML5Backend,
      backendOptions: options
    };
  }, [isTouchDevice]);

  return (
    <ReactDndProvider backend={Backend} options={backendOptions}>
      {children}
    </ReactDndProvider>
  );
}

export default DndProvider;
