import { useEffect, useRef } from 'react';

/**
 * Fires a callback when a click or touch event occurs outside the target element.
 * Also triggers on the 'Escape' key for convenient modal/menu closing.
 *
 * @param ref - Reference to the target element
 * @param handler - Function to call when an outside event is detected
 * @param enabled - Whether the event listeners should be active
 */
export function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | KeyboardEvent) => void,
  enabled: boolean = true
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    /** Internal click outside handler. */
    const handleClickOutside = (event: MouseEvent | TouchEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handlerRef.current(event as unknown as MouseEvent);
      }
    };

    /** Internal Escape key handler. */
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        handlerRef.current(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [ref, enabled]);
}

export default useOutsideClick;
