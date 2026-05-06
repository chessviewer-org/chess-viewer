import { useMemo } from 'react';

import { DndProvider as ReactDndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
function DndProvider({ children }) {
  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      const hasTouchPoints =
        (navigator as any).maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
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
      delayTouchStart: 150,
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
